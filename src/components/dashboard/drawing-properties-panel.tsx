"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { ToolType } from "@/components/dashboard/amatic-toolbar";

export type FillStyleOption = "solid" | "hachure" | "cross-hatch";
export type LayerAction =
  | "sendToBack"
  | "sendBackward"
  | "bringForward"
  | "bringToFront";

interface DrawingPropertiesPanelProps {
  visible: boolean;
  activeTool: ToolType;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyleOption;
  strokeWidth: number;
  opacity: number;
  selectedElementCount: number;
  onStrokeColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
  onFillStyleChange: (style: FillStyleOption) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onLayerAction: (action: LayerAction) => void;
}

const STROKE_COLORS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#ffffff",
];

const BACKGROUND_COLORS = [
  "transparent",
  "#fecaca",
  "#bbf7d0",
  "#bfdbfe",
  "#fde68a",
  "#fcd34d",
];

const FILL_STYLES: Array<{
  value: FillStyleOption;
  label: string;
  previewClassName: string;
}> = [
  {
    value: "hachure",
    label: "Hachure",
    previewClassName:
      "bg-[repeating-linear-gradient(135deg,#1f2937_0_2px,transparent_2px_5px)]",
  },
  {
    value: "cross-hatch",
    label: "Cross-hatch",
    previewClassName:
      "bg-[linear-gradient(45deg,#1f2937_12.5%,transparent_12.5%,transparent_50%,#1f2937_50%,#1f2937_62.5%,transparent_62.5%,transparent_100%),linear-gradient(-45deg,#1f2937_12.5%,transparent_12.5%,transparent_50%,#1f2937_50%,#1f2937_62.5%,transparent_62.5%,transparent_100%)] bg-[length:8px_8px]",
  },
  {
    value: "solid",
    label: "Solid",
    previewClassName: "bg-[#1f1b78]",
  },
];

const STROKE_WIDTHS = [
  { value: 2, className: "h-[2px]" },
  { value: 4, className: "h-[4px]" },
  { value: 8, className: "h-[8px]" },
];

function CheckerSwatch() {
  return (
    <div
      className="h-full w-full rounded-[10px] border border-slate-300"
      style={{
        backgroundImage:
          "linear-gradient(45deg,#e5e7eb 25%,transparent 25%), linear-gradient(-45deg,#e5e7eb 25%,transparent 25%), linear-gradient(45deg,transparent 75%,#e5e7eb 75%), linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
        backgroundSize: "12px 12px",
        backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
      }}
    />
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-[13px] font-medium text-slate-900">{children}</h3>;
}

export function DrawingPropertiesPanel({
  visible,
  activeTool,
  strokeColor,
  backgroundColor,
  fillStyle,
  strokeWidth,
  opacity,
  selectedElementCount,
  onStrokeColorChange,
  onBackgroundColorChange,
  onFillStyleChange,
  onStrokeWidthChange,
  onOpacityChange,
  onLayerAction,
}: DrawingPropertiesPanelProps) {
  const toolLabel =
    activeTool === "freedraw"
      ? "Brush controls"
      : activeTool === "text"
        ? "Text style"
        : "Shape controls";

  const hasSelection = selectedElementCount > 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          key="drawing-properties-panel"
          initial={{ opacity: 0, x: -24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -24, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-auto absolute left-3 top-24 z-[55] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-[18px] border border-slate-200/90 bg-white/95 shadow-[8px_0_0_rgba(148,163,184,0.45),0_18px_36px_rgba(15,23,42,0.12)] backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold text-slate-950">{toolLabel}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {hasSelection
                  ? `Editing ${selectedElementCount} selected layer${selectedElementCount === 1 ? "" : "s"}`
                  : "Applies to the next stroke or shape you draw"}
              </p>
            </div>
            <div className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-700">
              {activeTool}
            </div>
          </div>

          <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto px-5 py-5">
            <section className="space-y-3">
              <SectionTitle>Stroke</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {STROKE_COLORS.map((color) => {
                  const isWhite = color === "#ffffff";
                  const selected = strokeColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onStrokeColorChange(color)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-transform hover:scale-105",
                        selected ? "border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]" : "border-transparent",
                      )}
                      title={color}
                    >
                      <span
                        className="h-full w-full rounded-[10px]"
                        style={{
                          backgroundColor: color,
                          outline: isWhite ? "1px solid rgba(15, 23, 42, 0.25)" : "none",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Background</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_COLORS.map((color) => {
                  const selected = backgroundColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onBackgroundColorChange(color)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-transform hover:scale-105",
                        selected ? "border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]" : "border-transparent",
                      )}
                      title={color}
                    >
                      {color === "transparent" ? (
                        <CheckerSwatch />
                      ) : (
                        <span
                          className="h-full w-full rounded-[10px]"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Fill</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {FILL_STYLES.map((option) => {
                  const selected = fillStyle === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onFillStyleChange(option.value)}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-2xl border transition-all",
                        selected
                          ? "border-violet-400 bg-violet-100 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                          : "border-transparent bg-slate-100 hover:bg-slate-200",
                      )}
                      title={option.label}
                    >
                      <span
                        className={cn(
                          "h-5 w-5 rounded-md border border-slate-700/60",
                          option.previewClassName,
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Stroke width</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {STROKE_WIDTHS.map((option) => {
                  const selected = strokeWidth === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onStrokeWidthChange(option.value)}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-2xl border transition-all",
                        selected
                          ? "border-violet-400 bg-violet-100 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                          : "border-transparent bg-slate-100 hover:bg-slate-200",
                      )}
                      title={`${option.value}px`}
                    >
                      <span className={cn("w-6 rounded-full bg-slate-800", option.className)} />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle>Opacity</SectionTitle>
                <span className="text-[12px] font-medium text-slate-600">{opacity}%</span>
              </div>
              <Slider
                value={[opacity]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => onOpacityChange(value[0] ?? opacity)}
                className="[&_[data-slot=slider-range]]:bg-violet-400"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>0</span>
                <span>100</span>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Layers</SectionTitle>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { action: "sendToBack", label: "Back", icon: ChevronsDown },
                  { action: "sendBackward", label: "Down", icon: ArrowDown },
                  { action: "bringForward", label: "Up", icon: ArrowUp },
                  { action: "bringToFront", label: "Front", icon: ChevronsUp },
                ].map(({ action, label, icon: Icon }) => (
                  <button
                    key={action}
                    type="button"
                    disabled={!hasSelection}
                    onClick={() => onLayerAction(action as LayerAction)}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200",
                      !hasSelection && "cursor-not-allowed opacity-40 hover:bg-slate-100",
                    )}
                    title={hasSelection ? label : "Select an element first"}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </section>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
