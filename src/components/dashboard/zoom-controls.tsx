"use client";

import { Minus, Plus, Undo2, Redo2 } from 'lucide-react';

interface ZoomControlsProps {
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ZoomControls({
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Zoom Controls */}
      <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={onZoomOut}
          className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors text-gray-600 hover:text-gray-800"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomReset}
          className="px-3 py-2 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 min-w-[60px]"
          title="Reset zoom"
        >
          {zoom}%
        </button>
        <button
          onClick={onZoomIn}
          className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors text-gray-600 hover:text-gray-800"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Undo/Redo Controls */}
      <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-l-lg transition-colors ${
            canUndo 
              ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-800' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-r-lg transition-colors ${
            canRedo 
              ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-800' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

