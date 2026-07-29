'use client';

/**
 * Live Illustration Component
 * 
 * Renders AI-generated React/TSX code with Framer Motion animations
 * in a sandboxed environment using react-live.
 * 
 * Features:
 * - Sandboxed code execution
 * - Framer Motion animation support
 * - Tailwind CSS styling
 * - Error handling with fallback UI
 * - Interactive hover/click support
 */

import React, { useState, useCallback, useMemo } from 'react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

// Enhanced scope for react-live - libraries available in generated code
const scope = {
  React,
  useState,
  useCallback,
  useMemo,
  motion,
  AnimatePresence,
  // Common React hooks
  useEffect: React.useEffect,
  useRef: React.useRef,
  // Fragment for multiple elements
  Fragment: React.Fragment,
  // Spread array helper for animations
  Array,
  // Math for calculations
  Math,
  // NEW: Color utilities for professional illustrations
  hsl: (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`,
  hsla: (h: number, s: number, l: number, a: number) => `hsla(${h}, ${s}%, ${l}%, ${a})`,
  // NEW: Gradient helper
  linearGradient: (angle: number, ...stops: string[]) => 
    `linear-gradient(${angle}deg, ${stops.join(', ')})`,
  // NEW: Animation presets
  springConfig: { type: 'spring' as const, stiffness: 300, damping: 25 },
  bounceConfig: { type: 'spring' as const, stiffness: 400, damping: 10 },
};

export interface LiveIllustrationProps {
  /** TSX code string to render */
  code: string;
  /** Unique identifier */
  id: string;
  /** Position on canvas */
  x: number;
  y: number;
  /** Dimensions */
  width?: number;
  height?: number;
  /** Whether the illustration is selected */
  isSelected?: boolean;
  /** Callback when clicked */
  onClick?: () => void;
  /** Callback for drag start */
  onDragStart?: () => void;
  /** Callback for drag end */
  onDragEnd?: (x: number, y: number) => void;
  /** Whether to show controls */
  showControls?: boolean;
  /** Scale factor */
  scale?: number;
}

/**
 * Transform TSX code to be react-live compatible
 * Wraps code in a render function if needed
 * 
 * CRITICAL: react-live v4 uses Sucrase with 'imports' transform which converts
 * import statements to require() calls. We MUST strip ALL imports before passing
 * code to LiveProvider, otherwise it will fail with "require is not defined" in browser.
 */
function transformCode(code: string): string {
  // STEP 1: Remove ALL import statements comprehensively
  // react-live will apply imports transform which converts imports to require()
  // We provide all dependencies via scope prop instead
  let transformed = code;
  
  // Remove all forms of import statements (multiline and single line)
  // Match: import ... from '...'
  // Match: import ... from "..."
  // Match: import {...} from '...'
  // Match: import * as ... from '...'
  // Match: import defaultExport, {...} from '...'
  transformed = transformed.replace(/import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+)?['"][^'"]+['"]\s*;?/gim, '');
  
  // Safety: Remove any remaining standalone import lines
  transformed = transformed.replace(/^\s*import\s+.+$/gim, '');
  
  // STEP 2: Remove export statements (don't work in Function context)
  transformed = transformed.replace(/export\s+default\s+/g, '');
  transformed = transformed.replace(/export\s+/g, '');
  
  // STEP 3: Clean up empty lines
  transformed = transformed.replace(/\n\n\n+/g, '\n\n');
  
  const trimmed = transformed.trim();
  
  // If code is just JSX (starts with <), wrap it in render
  if (trimmed.startsWith('<') || trimmed.startsWith('(')) {
    return `render(${trimmed})`;
  }
  
  // If code starts with imports, extract them and handle component separately
  if (trimmed.startsWith('import')) {
    // Split imports from the rest of the code
    const lines = trimmed.split('\n');
    const imports: string[] = [];
    const rest: string[] = [];
    
    let inImports = true;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (inImports && (trimmedLine.startsWith('import') || trimmedLine === '')) {
        imports.push(line);
      } else {
        inImports = false;
        rest.push(line);
      }
    }
    
    const restCode = rest.join('\n').trim();
    
    // Try to extract component name from the rest
    const nameMatch = restCode.match(/(?:function|const)\s+(\w+)/);
    if (nameMatch) {
      return `${imports.join('\n')}\n\n${restCode}\n\nrender(<${nameMatch[1]} />)`;
    }
    
    // If no component name found, just return as-is (might be inline JSX)
    return `${imports.join('\n')}\n\n${restCode}`;
  }
  
  // If it's a function component without imports
  if (trimmed.startsWith('function') || trimmed.startsWith('const')) {
    // Extract component name
    const nameMatch = trimmed.match(/(?:function|const)\s+(\w+)/);
    if (nameMatch) {
      return `${trimmed}\nrender(<${nameMatch[1]} />)`;
    }
  }
  
  // Last resort fallback - just wrap in render
  return `render(${transformed})`;
}

/**
 * Error Fallback Component
 */
function ErrorFallback({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-dashed border-red-200 p-4">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-sm text-red-600 text-center mb-2 font-medium">
        Illustration Error
      </p>
      <p className="text-xs text-red-400 text-center max-w-[200px] mb-3 font-mono">
        {error.slice(0, 100)}...
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Live Illustration Component
 */
export function LiveIllustration({
  code,
  id,
  x,
  y,
  width = 480,
  height = 360,
  isSelected = false,
  onClick,
  onDragStart,
  onDragEnd,
  showControls = true,
  scale = 1,
}: LiveIllustrationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Transform code for react-live with error handling
  const transformedCode = useMemo(() => {
    try {
      console.log('[LiveIllustration] ===== CODE TRANSFORMATION START =====');
      console.log('[LiveIllustration] Original code length:', code.length);
      console.log('[LiveIllustration] Original has import:', code.includes('import '));
      console.log('[LiveIllustration] Original has require:', code.includes('require('));
      console.log('[LiveIllustration] Original code sample:\n', code.substring(0, 400));
      
      const result = transformCode(code);
      
      console.log('[LiveIllustration] ----- AFTER TRANSFORM -----');
      console.log('[LiveIllustration] Result length:', result.length);
      console.log('[LiveIllustration] Result has import:', result.includes('import '));
      console.log('[LiveIllustration] Result has require:', result.includes('require('));
      console.log('[LiveIllustration] Result code sample:\n', result.substring(0, 400));
      console.log('[LiveIllustration] ===== CODE TRANSFORMATION END =====');
      
      // If imports still exist, something is wrong with our regex
      if (result.includes('import ')) {
        console.error('[LiveIllustration] WARNING: Imports still present after stripping!');
        console.error('[LiveIllustration] This will cause "require is not defined" error');
      }
      
      // Reset error state on successful transform
      setHasError(false);
      return result;
    } catch (err) {
      console.error('[LiveIllustration] Transform error:', err);
      setHasError(true);
      return 'render(<div>Invalid code</div>)';
    }
  }, [code]);

  // Handle drag
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    setIsDragging(false);
    // Use offset from original position, not absolute pointer position
    onDragEnd?.(x + info.offset.x, y + info.offset.y);
  }, [onDragEnd, x, y]);

  return (
    <motion.div
      className={`absolute cursor-pointer ${isSelected ? 'ring-2 ring-violet-500 ring-offset-2' : ''} ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
      style={{
        left: x,
        top: y,
        width: isExpanded ? width * 1.5 : width,
        height: isExpanded ? height * 1.5 : height,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      whileHover={{ scale: scale * 1.02 }}
      data-illustration-id={id}
    >
      {/* Illustration Container - no background, direct on canvas */}
      <div className="relative w-full h-full">
        {/* Controls - only show when selected */}
        {showControls && isSelected && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4 text-gray-600" />
              ) : (
                <Maximize2 className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        )}

        {/* Live Preview */}
        <LiveProvider 
          code={transformedCode} 
          scope={scope}
          noInline
        >
          <div className="w-full h-full flex items-center justify-center p-4">
            {hasError ? (
              <ErrorFallback 
                error="Failed to render illustration" 
                onRetry={() => setHasError(false)} 
              />
            ) : (
              <>
                <div className="w-full h-full flex items-center justify-center">
                  <LivePreview className="w-full h-full" />
                </div>
                <LiveError 
                  className="absolute inset-0 flex items-center justify-center bg-red-50/90 p-4 text-xs text-red-500 font-mono" 
                />
              </>
            )}
          </div>
        </LiveProvider>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              border: '2px solid rgba(139, 92, 246, 0.5)',
              boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.1)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

/**
 * Preview component for Dynamic Island (shows code being generated)
 */
export function IllustrationPreview({ code }: { code: string }) {
  const transformedCode = useMemo(() => {
    try {
      return transformCode(code);
    } catch {
      return 'render(<div className="text-gray-400">Generating...</div>)';
    }
  }, [code]);

  return (
    <div className="w-full h-32 rounded-lg overflow-hidden bg-white/5 border border-white/10">
      <LiveProvider code={transformedCode} scope={scope} noInline>
        <div className="w-full h-full flex items-center justify-center transform scale-50 origin-center">
          <LivePreview />
        </div>
      </LiveProvider>
    </div>
  );
}

export default LiveIllustration;

