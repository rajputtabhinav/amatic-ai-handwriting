"use client";

import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasStore } from '@/stores/canvas-store';

interface CollabErrorProps {
  onRetry?: () => void;
}

/**
 * Display collaboration connection errors
 */
export function CollabError({ onRetry }: CollabErrorProps) {
  const { collabError, setCollabError, stopCollaboration } = useCanvasStore();
  
  if (!collabError) return null;
  
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg shadow-md max-w-xs">
        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-red-700 truncate">{collabError}</p>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-5 w-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-100 rounded"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCollabError(null);
              stopCollaboration();
            }}
            className="h-5 w-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-100 rounded"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CollabError;

