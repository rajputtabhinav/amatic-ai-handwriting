"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ComponentType,
} from "react";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { AmaticHeader } from "@/components/dashboard/amatic-header";
import {
  AmaticToolbar,
  type ToolType as AmaticToolType,
} from "@/components/dashboard/amatic-toolbar";
import {
  DrawingPropertiesPanel,
  type FillStyleOption,
  type LayerAction,
} from "@/components/dashboard/drawing-properties-panel";
import type { StreamPhase } from "@/hooks/use-streaming-visual";

interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: FillStyleOption;
  strokeWidth?: number;
  opacity?: number;
  [key: string]: unknown;
}

interface BinaryFileData {
  mimeType: string;
  id: string;
  dataURL: string;
  created: number;
  lastRetrieved?: number;
  version?: number;
}

interface VisualCanvasItem {
  id: string;
  type: string;
  label?: string;
  imageUrl?: string;
  position?: {
    x?: number;
    y?: number;
  };
  size?: {
    width?: number;
    height?: number;
  };
}

interface ExcalidrawAPI {
  exportToBlob: (options: { mimeType: string; quality: number }) => Promise<Blob>;
  updateScene: (scene: {
    elements: ExcalidrawElement[];
    appState?: Record<string, unknown>;
    files?: Record<string, BinaryFileData>;
  }) => void;
  getAppState: () => Record<string, unknown>;
  getSceneElements: () => ExcalidrawElement[];
  scrollToContent: (
    target?: ExcalidrawElement[] | null,
    opts?: { fitToContent?: boolean; animate?: boolean },
  ) => void;
  setActiveTool: (tool: { type: string; locked?: boolean }) => void;
  addFiles: (files: BinaryFileData[]) => void;
  getFiles: () => Record<string, BinaryFileData>;
}

interface ExcalidrawAppState {
  activeTool?: {
    type: string;
    locked?: boolean;
  };
  selectedElementIds?: Record<string, boolean>;
  currentItemStrokeColor?: string;
  currentItemBackgroundColor?: string;
  currentItemFillStyle?: FillStyleOption;
  currentItemStrokeWidth?: number;
  currentItemStrokeStyle?: string;
  currentItemOpacity?: number;
  [key: string]: unknown;
}

declare global {
  interface Window {
    excalidrawAPI?: ExcalidrawAPI;
  }
}

let ExcalidrawComponent: ComponentType<Record<string, unknown>> | null = null;

interface ExcalidrawCanvasProps {
  className?: string;
  aiPhase?: StreamPhase;
  aiExplanation?: string;
  aiCode?: string;
  aiError?: string | null;
  visualItems?: VisualCanvasItem[];
  canvasResponse?: string;
  canvasQuestion?: string;
}

const TOOL_TYPE_MAP: Record<AmaticToolType, string> = {
  selection: "selection",
  hand: "hand",
  rectangle: "rectangle",
  diamond: "diamond",
  ellipse: "ellipse",
  arrow: "arrow",
  line: "line",
  freedraw: "freedraw",
  text: "text",
  image: "image",
  eraser: "eraser",
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function areStringArraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

async function toDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download AI image: ${response.status}`);
  }

  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read AI image blob"));
    reader.readAsDataURL(blob);
  });

  return {
    dataUrl,
    mimeType: blob.type || "image/png",
  };
}

export function ExcalidrawCanvas({
  className,
  aiPhase = "idle",
  aiExplanation = "",
  aiCode = "",
  aiError = null,
  visualItems = [],
  canvasResponse,
  canvasQuestion,
}: ExcalidrawCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawAPI | null>(null);
  const [excalidrawLoaded, setExcalidrawLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState<AmaticToolType>("selection");
  const [activeColor, setActiveColor] = useState("#1e1e1e");
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [fillStyle, setFillStyle] = useState<FillStyleOption>("solid");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(100);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const insertedVisualIdsRef = useRef<Set<string>>(new Set());
  const insertedResponseKeyRef = useRef<string | null>(null);

  const isDrawableTool = [
    "rectangle",
    "diamond",
    "ellipse",
    "arrow",
    "line",
    "freedraw",
    "text",
  ].includes(activeTool);

  useEffect(() => {
    const loadExcalidraw = async () => {
      try {
        const excalidrawModule = await import("@excalidraw/excalidraw");
        ExcalidrawComponent = excalidrawModule.Excalidraw as ComponentType<Record<string, unknown>>;
        setExcalidrawLoaded(true);
      } catch (error) {
        console.error("Failed to load Excalidraw:", error);
      }
    };

    loadExcalidraw();
  }, []);

  const handleElementsChange = useCallback(
    (newElements: ExcalidrawElement[], appState?: ExcalidrawAppState) => {
      if (!appState) {
        return;
      }

      const nextSelectedIds = Object.entries(appState.selectedElementIds ?? {})
        .filter(([, isSelected]) => Boolean(isSelected))
        .map(([id]) => id);

      setSelectedElementIds((currentIds) =>
        areStringArraysEqual(currentIds, nextSelectedIds) ? currentIds : nextSelectedIds,
      );

      const styleSource =
        nextSelectedIds.length > 0
          ? newElements.find((element) => element.id === nextSelectedIds[nextSelectedIds.length - 1])
          : appState;

      if (!styleSource) {
        return;
      }

      if (typeof styleSource.strokeColor === "string") {
        const nextStrokeColor = styleSource.strokeColor;
        setActiveColor((current) =>
          current === nextStrokeColor ? current : nextStrokeColor,
        );
      } else if (typeof appState.currentItemStrokeColor === "string") {
        const nextStrokeColor = appState.currentItemStrokeColor;
        setActiveColor((current) =>
          current === nextStrokeColor ? current : nextStrokeColor,
        );
      }

      if (typeof styleSource.backgroundColor === "string") {
        const nextBackgroundColor = styleSource.backgroundColor;
        setBackgroundColor((current) =>
          current === nextBackgroundColor ? current : nextBackgroundColor,
        );
      } else if (typeof appState.currentItemBackgroundColor === "string") {
        const nextBackgroundColor = appState.currentItemBackgroundColor;
        setBackgroundColor((current) =>
          current === nextBackgroundColor ? current : nextBackgroundColor,
        );
      }

      if (
        styleSource.fillStyle === "solid" ||
        styleSource.fillStyle === "hachure" ||
        styleSource.fillStyle === "cross-hatch"
      ) {
        const nextFillStyle = styleSource.fillStyle;
        setFillStyle((current) =>
          current === nextFillStyle ? current : nextFillStyle,
        );
      } else if (
        appState.currentItemFillStyle === "solid" ||
        appState.currentItemFillStyle === "hachure" ||
        appState.currentItemFillStyle === "cross-hatch"
      ) {
        const nextFillStyle = appState.currentItemFillStyle;
        setFillStyle((current) =>
          current === nextFillStyle ? current : nextFillStyle,
        );
      }

      if (typeof styleSource.strokeWidth === "number") {
        const nextStrokeWidth = styleSource.strokeWidth;
        setStrokeWidth((current) =>
          current === nextStrokeWidth ? current : nextStrokeWidth,
        );
      } else if (typeof appState.currentItemStrokeWidth === "number") {
        const nextStrokeWidth = appState.currentItemStrokeWidth;
        setStrokeWidth((current) =>
          current === nextStrokeWidth ? current : nextStrokeWidth,
        );
      }

      if (typeof styleSource.opacity === "number") {
        const nextOpacity = styleSource.opacity;
        setOpacity((current) =>
          current === nextOpacity ? current : nextOpacity,
        );
      } else if (typeof appState.currentItemOpacity === "number") {
        const nextOpacity = appState.currentItemOpacity;
        setOpacity((current) =>
          current === nextOpacity ? current : nextOpacity,
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (excalidrawAPI && typeof window !== "undefined") {
      window.excalidrawAPI = excalidrawAPI;
    }
  }, [excalidrawAPI]);

  const updateAppState = useCallback(
    (partialAppState: ExcalidrawAppState) => {
      if (!excalidrawAPI) {
        return;
      }

      excalidrawAPI.updateScene({
        elements: excalidrawAPI.getSceneElements(),
        files: excalidrawAPI.getFiles(),
        appState: {
          ...excalidrawAPI.getAppState(),
          ...partialAppState,
        },
      });
    },
    [excalidrawAPI],
  );

  const getToolAppState = useCallback(
    (
      tool: AmaticToolType,
      locked: boolean,
      styles: {
        strokeColor: string;
        background: string;
        fill: FillStyleOption;
        width: number;
        opacity: number;
      },
    ): ExcalidrawAppState => ({
      activeTool: {
        type: TOOL_TYPE_MAP[tool],
        locked,
      },
      currentItemStrokeColor: styles.strokeColor,
      currentItemBackgroundColor:
        tool === "freedraw" && styles.background === "transparent"
          ? styles.strokeColor
          : styles.background,
      currentItemFillStyle: styles.fill,
      currentItemStrokeWidth: styles.width,
      currentItemStrokeStyle: "solid",
      currentItemOpacity: styles.opacity,
    }),
    [],
  );

  const syncToolState = useCallback(
    (
      tool: AmaticToolType,
      locked: boolean,
      styles = {
        strokeColor: activeColor,
        background: backgroundColor,
        fill: fillStyle,
        width: strokeWidth,
        opacity,
      },
    ) => {
      if (!excalidrawAPI) {
        return;
      }

      excalidrawAPI.setActiveTool({
        type: TOOL_TYPE_MAP[tool],
        locked,
      });

      updateAppState(getToolAppState(tool, locked, styles));
    },
    [
      activeColor,
      backgroundColor,
      excalidrawAPI,
      fillStyle,
      getToolAppState,
      opacity,
      strokeWidth,
      updateAppState,
    ],
  );

  const updateElements = useCallback(
    (updater: (elements: ExcalidrawElement[]) => ExcalidrawElement[]) => {
      if (!excalidrawAPI) {
        return;
      }

      excalidrawAPI.updateScene({
        elements: updater(excalidrawAPI.getSceneElements()),
        files: excalidrawAPI.getFiles(),
        appState: {
          ...excalidrawAPI.getAppState(),
        },
      });
    },
    [excalidrawAPI],
  );

  const applyStylePatchToSelectedElements = useCallback(
    (patch: Partial<ExcalidrawElement>) => {
      if (!selectedElementIds.length) {
        return;
      }

      const selectedIds = new Set(selectedElementIds);
      updateElements((elements) =>
        elements.map((element) =>
          selectedIds.has(element.id)
            ? {
                ...element,
                ...patch,
              }
            : element,
        ),
      );
    },
    [selectedElementIds, updateElements],
  );

  const applyCanvasStylePatch = useCallback(
    (patch: {
      strokeColor?: string;
      background?: string;
      fill?: FillStyleOption;
      width?: number;
      opacity?: number;
    }) => {
      const nextStyles = {
        strokeColor: patch.strokeColor ?? activeColor,
        background: patch.background ?? backgroundColor,
        fill: patch.fill ?? fillStyle,
        width: patch.width ?? strokeWidth,
        opacity: patch.opacity ?? opacity,
      };

      if (patch.strokeColor) {
        setActiveColor(patch.strokeColor);
      }
      if (patch.background) {
        setBackgroundColor(patch.background);
      }
      if (patch.fill) {
        setFillStyle(patch.fill);
      }
      if (typeof patch.width === "number") {
        setStrokeWidth(patch.width);
      }
      if (typeof patch.opacity === "number") {
        setOpacity(patch.opacity);
      }

      syncToolState(activeTool, isLocked, nextStyles);
      applyStylePatchToSelectedElements({
        ...(patch.strokeColor ? { strokeColor: patch.strokeColor } : {}),
        ...(patch.background ? { backgroundColor: patch.background } : {}),
        ...(patch.fill ? { fillStyle: patch.fill } : {}),
        ...(typeof patch.width === "number" ? { strokeWidth: patch.width } : {}),
        ...(typeof patch.opacity === "number" ? { opacity: patch.opacity } : {}),
      });
    },
    [
      activeColor,
      activeTool,
      applyStylePatchToSelectedElements,
      backgroundColor,
      fillStyle,
      isLocked,
      opacity,
      strokeWidth,
      syncToolState,
    ],
  );

  const appendElements = useCallback(
    (newElements: ExcalidrawElement[]) => {
      if (!excalidrawAPI || newElements.length === 0) {
        return;
      }

      const nextElements = [
        ...excalidrawAPI.getSceneElements(),
        ...newElements,
      ];

      excalidrawAPI.updateScene({
        elements: nextElements,
        files: excalidrawAPI.getFiles(),
        appState: {
          ...excalidrawAPI.getAppState(),
        },
      });

      excalidrawAPI.scrollToContent(newElements, {
        fitToContent: false,
        animate: true,
      });
    },
    [excalidrawAPI],
  );

  const addResponseCard = useCallback(
    (question: string | undefined, response: string) => {
      if (!response.trim()) {
        return;
      }

      const responseKey = `${question ?? ""}:${response}`;
      if (insertedResponseKeyRef.current === responseKey) {
        return;
      }
      insertedResponseKeyRef.current = responseKey;

      const noteX = 120;
      const noteY = 120;
      const title = question ? `AI: ${question}` : "AI response";
      const body = response.length > 280 ? `${response.slice(0, 277)}...` : response;

      const cardElements = convertToExcalidrawElements([
        {
          type: "rectangle",
          x: noteX,
          y: noteY,
          width: 520,
          height: 180,
          strokeColor: "#312e81",
          backgroundColor: "#eef2ff",
          roughness: 0,
          roundness: { type: 3 },
        },
        {
          type: "text",
          x: noteX + 20,
          y: noteY + 20,
          text: `${title}\n\n${body}`,
          width: 460,
          fontSize: 20,
          strokeColor: "#1e1b4b",
        },
      ]) as ExcalidrawElement[];

      appendElements(cardElements);
    },
    [appendElements],
  );

  const addVisualItemToCanvas = useCallback(
    async (item: VisualCanvasItem, index: number) => {
      if (!excalidrawAPI || !item.imageUrl) {
        return;
      }

      const fileId = createId("ai-file");
      const imageId = createId("ai-image");
      const noteX = item.position?.x ?? 120 + (index % 3) * 340;
      const noteY = item.position?.y ?? 220 + Math.floor(index / 3) * 280;
      const width = item.size?.width ?? 280;
      const height = item.size?.height ?? 180;
      const labelText = item.label ?? "AI visual";

      const { dataUrl, mimeType } = await toDataUrl(item.imageUrl);
      const file: BinaryFileData = {
        id: fileId,
        mimeType,
        dataURL: dataUrl,
        created: Date.now(),
      };

      excalidrawAPI.addFiles([file]);

      const sceneElements = convertToExcalidrawElements([
        {
          type: "image",
          id: imageId,
          x: noteX,
          y: noteY,
          width,
          height,
          fileId: fileId as never,
        },
        {
          type: "rectangle",
          x: noteX - 16,
          y: noteY - 50,
          width: width + 32,
          height: height + 86,
          strokeColor: "#312e81",
          backgroundColor: "#ffffff",
          roughness: 0,
          roundness: { type: 3 },
        },
        {
          type: "text",
          x: noteX,
          y: noteY - 34,
          text: labelText,
          width,
          fontSize: 22,
          strokeColor: "#1e1b4b",
        },
      ]) as ExcalidrawElement[];

      const [, card, label] = sceneElements;
      appendElements([card, label, sceneElements[0]]);
    },
    [appendElements, excalidrawAPI],
  );

  useEffect(() => {
    if (!visualItems.length) {
      return;
    }

    let cancelled = false;

    const syncVisuals = async () => {
      const pendingItems = visualItems.filter(
        (item) => !insertedVisualIdsRef.current.has(item.id),
      );

      for (let index = 0; index < pendingItems.length; index += 1) {
        const item = pendingItems[index];
        try {
          await addVisualItemToCanvas(item, insertedVisualIdsRef.current.size + index);
          if (!cancelled) {
            insertedVisualIdsRef.current.add(item.id);
          }
        } catch (error) {
          console.error("Failed to insert AI visual onto canvas:", error);
        }
      }
    };

    void syncVisuals();

    return () => {
      cancelled = true;
    };
  }, [addVisualItemToCanvas, visualItems]);

  useEffect(() => {
    if (canvasResponse) {
      addResponseCard(canvasQuestion, canvasResponse);
    }
  }, [addResponseCard, canvasQuestion, canvasResponse]);

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    syncToolState(activeTool, isLocked, {
      strokeColor: activeColor,
      background: backgroundColor,
      fill: fillStyle,
      width: strokeWidth,
      opacity,
    });
  }, [excalidrawAPI, activeColor, activeTool, backgroundColor, fillStyle, isLocked, opacity, strokeWidth, syncToolState]);

  const handleToolChange = useCallback(
    (tool: AmaticToolType) => {
      setActiveTool(tool);
      syncToolState(tool, isLocked);
    },
    [isLocked, syncToolState],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      applyCanvasStylePatch({ strokeColor: color });
    },
    [applyCanvasStylePatch],
  );

  const handleLockChange = useCallback(
    (locked: boolean) => {
      setIsLocked(locked);
      syncToolState(activeTool, locked);
    },
    [activeTool, syncToolState],
  );

  const handleResetCanvas = useCallback(() => {
    if (!excalidrawAPI) {
      return;
    }

    insertedVisualIdsRef.current.clear();
    insertedResponseKeyRef.current = null;

    excalidrawAPI.updateScene({
      elements: [],
      files: {},
      appState: {
        ...excalidrawAPI.getAppState(),
        ...getToolAppState(activeTool, isLocked, {
          strokeColor: activeColor,
          background: backgroundColor,
          fill: fillStyle,
          width: strokeWidth,
          opacity,
        }),
      },
    });
  }, [
    activeColor,
    activeTool,
    backgroundColor,
    excalidrawAPI,
    fillStyle,
    getToolAppState,
    isLocked,
    opacity,
    strokeWidth,
  ]);

  const handleLayerAction = useCallback(
    (action: LayerAction) => {
      if (!selectedElementIds.length) {
        return;
      }

      const selectedIds = new Set(selectedElementIds);

      updateElements((elements) => {
        if (action === "bringToFront") {
          return [
            ...elements.filter((element) => !selectedIds.has(element.id)),
            ...elements.filter((element) => selectedIds.has(element.id)),
          ];
        }

        if (action === "sendToBack") {
          return [
            ...elements.filter((element) => selectedIds.has(element.id)),
            ...elements.filter((element) => !selectedIds.has(element.id)),
          ];
        }

        const next = [...elements];

        if (action === "bringForward") {
          for (let index = next.length - 2; index >= 0; index -= 1) {
            if (
              selectedIds.has(next[index].id) &&
              !selectedIds.has(next[index + 1].id)
            ) {
              [next[index], next[index + 1]] = [next[index + 1], next[index]];
            }
          }
          return next;
        }

        for (let index = 1; index < next.length; index += 1) {
          if (
            selectedIds.has(next[index].id) &&
            !selectedIds.has(next[index - 1].id)
          ) {
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
          }
        }
        return next;
      });
    },
    [selectedElementIds, updateElements],
  );

  const handleExportImage = useCallback(async () => {
    if (!excalidrawAPI) {
      return;
    }

    try {
      const blob = await excalidrawAPI.exportToBlob({
        mimeType: "image/png",
        quality: 1,
      });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "amatic-canvas.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to export canvas image:", error);
    }
  }, [excalidrawAPI]);

  const handleSave = useCallback(() => {
    if (!excalidrawAPI || typeof window === "undefined") {
      return;
    }

    const snapshot = {
      elements: excalidrawAPI.getSceneElements(),
      files: excalidrawAPI.getFiles(),
      appState: excalidrawAPI.getAppState(),
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("amatic:canvas-scene", JSON.stringify(snapshot));
  }, [excalidrawAPI]);

  const handleHelp = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.alert(
      "Use the bottom AI bar to generate visuals, the top floating toolbar to pick tools, and the top-left menu to export or reset the canvas."
    );
  }, []);

  return (
    <div
      className={`amatic amatic-container relative h-full w-full min-h-0 overflow-hidden bg-[#f8fafc] ${className ?? ""}`}
    >
      {excalidrawLoaded && ExcalidrawComponent ? (
        <>
          <div className="absolute inset-0">
            <ExcalidrawComponent
              excalidrawAPI={(api: unknown) => setExcalidrawAPI(api as ExcalidrawAPI)}
              onChange={handleElementsChange}
              initialData={{
                elements: [],
                appState: {
                  theme: "light",
                  viewBackgroundColor: "#ffffff",
                  currentItemStrokeColor: "#1e1e1e",
                  currentItemBackgroundColor: "transparent",
                  currentItemFillStyle: "solid",
                  currentItemStrokeWidth: 4,
                  currentItemOpacity: 100,
                  activeTool: {
                    type: "selection",
                    locked: false,
                  },
                  gridSize: 20,
                  zenModeEnabled: false,
                  viewModeEnabled: false,
                },
              }}
              UIOptions={{
                canvasActions: {
                  loadScene: true,
                  clearCanvas: true,
                  export: { saveFileToDisk: true },
                  saveAsImage: true,
                  toggleTheme: false,
                },
                tools: {
                  image: true,
                },
              }}
              theme="light"
            />
          </div>

          <DrawingPropertiesPanel
            visible={isDrawableTool}
            activeTool={activeTool}
            strokeColor={activeColor}
            backgroundColor={backgroundColor}
            fillStyle={fillStyle}
            strokeWidth={strokeWidth}
            opacity={opacity}
            selectedElementCount={selectedElementIds.length}
            onStrokeColorChange={(color) => applyCanvasStylePatch({ strokeColor: color })}
            onBackgroundColorChange={(color) => applyCanvasStylePatch({ background: color })}
            onFillStyleChange={(style) => applyCanvasStylePatch({ fill: style })}
            onStrokeWidthChange={(width) => applyCanvasStylePatch({ width })}
            onOpacityChange={(nextOpacity) => applyCanvasStylePatch({ opacity: nextOpacity })}
            onLayerAction={handleLayerAction}
          />

          <AmaticHeader
            onSave={handleSave}
            onExportImage={handleExportImage}
            onResetCanvas={handleResetCanvas}
            onHelp={handleHelp}
          />

          <div data-onboarding="visual-mode">
            <AmaticToolbar
              activeTool={activeTool}
              onToolChange={handleToolChange}
              isLocked={isLocked}
              onLockChange={handleLockChange}
              activeColor={activeColor}
              onColorChange={handleColorChange}
              aiPhase={aiPhase}
              aiExplanation={aiExplanation}
              aiCode={aiCode}
              aiError={aiError}
            />
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center bg-white">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
            <p className="text-lg text-gray-600">Loading Canvas...</p>
            <p className="text-sm text-gray-400">Setting up drawing tools</p>
          </div>
        </div>
      )}
    </div>
  );
}
