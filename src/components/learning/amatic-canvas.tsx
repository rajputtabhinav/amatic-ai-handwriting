"use client";

import { useState, useCallback, useEffect, ComponentType } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, RotateCcw } from "lucide-react";

// Type definitions for canvas elements (dynamic import)
interface AmaticElement {
  id: string;
  type: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

interface AmaticAPI {
  exportToBlob: (options: { mimeType: string; quality: number }) => Promise<Blob>;
  updateScene: (scene: { elements: AmaticElement[]; appState?: Record<string, unknown> }) => void;
  getAppState: () => Record<string, unknown>;
}

// Dynamic imports for canvas library to avoid SSR issues
let AmaticComponent: ComponentType<Record<string, unknown>> | null = null;

interface AmaticCanvasProps {
  onElementsChange?: (elements: AmaticElement[]) => void;
  className?: string;
}

export function AmaticCanvas({ onElementsChange, className }: AmaticCanvasProps) {
  const [amaticAPI, setAmaticAPI] = useState<AmaticAPI | null>(null);
  const [elements, setElements] = useState<AmaticElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [amaticLoaded, setAmaticLoaded] = useState(false);

  // Dynamically load canvas library components
  useEffect(() => {
    const loadAmaticCanvas = async () => {
      try {
        const excalidrawModule = await import("@excalidraw/excalidraw");
        AmaticComponent = excalidrawModule.Excalidraw as ComponentType<Record<string, unknown>>;
        setAmaticLoaded(true);
      } catch (error) {
        console.error("Failed to load canvas library:", error);
      }
    };

    loadAmaticCanvas();
  }, []);

  const handleElementsChange = useCallback((newElements: AmaticElement[]) => {
    setElements(newElements);
    onElementsChange?.(newElements);
  }, [onElementsChange]);

  const handleExportAsPNG = useCallback(async () => {
    if (!amaticAPI) return;
    
    try {
      const blob = await amaticAPI.exportToBlob({
        mimeType: "image/png",
        quality: 0.9,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pensil-diagram.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PNG:", error);
    }
  }, [amaticAPI]);

  const handleClearCanvas = useCallback(() => {
    if (!amaticAPI) return;
    
    amaticAPI.updateScene({ 
      elements: [],
      appState: { 
        ...amaticAPI.getAppState(),
        viewBackgroundColor: "#ffffff"
      }
    });
  }, [amaticAPI]);

  const handleAIEnhance = useCallback(async () => {
    if (!amaticAPI || elements.length === 0) return;
    
    // TODO: Connect to AI service for diagram enhancement
    // Future implementation will analyze the drawing and suggest improvements
  }, [amaticAPI, elements]);

  return (
    <Card className={`bg-white border-gray-200 overflow-hidden ${className}`}>
      {/* Canvas Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: '#6366F120' }}
            >
              <Sparkles className="h-5 w-5" style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Visual Canvas</h3>
              <p className="text-sm text-gray-500">Draw and explore concepts visually</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIEnhance}
              className="border-gray-200 text-gray-700 hover:text-gray-900"
              disabled={elements.length === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Enhance
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAsPNG}
              className="border-gray-200 text-gray-700 hover:text-gray-900"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
              className="border-gray-200 text-gray-700 hover:text-gray-900"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Amatic Canvas */}
      <div style={{ height: "600px", width: "100%" }}>
        {amaticLoaded && AmaticComponent ? (
          <AmaticComponent
            ref={(api: unknown) => setAmaticAPI(api as AmaticAPI)}
            onChange={handleElementsChange}
            onPointerUpdate={() => {
              if (isLoading) setIsLoading(false);
            }}
            initialData={{
              elements: [],
              appState: {
                theme: "light",
                viewBackgroundColor: "#ffffff",
                currentItemStrokeColor: "#6366F1",
                currentItemBackgroundColor: "#6366F120",
                gridSize: null,
                zenModeEnabled: true,
                viewModeEnabled: false,
                zoom: { value: 0.75 }, // Default 75% zoom for better visibility
              }
            }}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                clearCanvas: false,
                export: false,
                saveAsImage: false,
                toggleTheme: false,
              },
              tools: {
                image: false,
              },
              welcomeScreen: false,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6366F1' }}></div>
              <p className="text-gray-600">Loading Visual Canvas...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Elements: {elements.length}</span>
            <span>•</span>
            <span>AI-Enhanced Canvas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
