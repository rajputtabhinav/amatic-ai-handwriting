'use client';

/**
 * Streaming Visual Hook
 * 
 * ChatGPT-style streaming for Dynamic Island:
 * - Phase 1: Educational explanation
 * - Phase 2: Code generation (React/TSX or SVG)
 * 
 * Supports both SVG and React/Framer Motion formats.
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// Temporary type definitions (replace svg-parser-streaming)
export interface ParsedSVGElement {
  id: string;
  type: string;
  label?: string;
  imageUrl?: string;
}

interface SVGParserState {
  elements: ParsedSVGElement[];
}

export type StreamPhase = 'idle' | 'optimizing' | 'planning' | 'explaining' | 'coding' | 'generating' | 'complete' | 'error';
export type VisualFormat = 'svg' | 'react';

export interface StreamingVisualState {
  phase: StreamPhase;
  explanation: string;
  code: string;
  svgCode: string | null;
  reactCode: string | null;  // React/TSX code for animated illustrations
  format: VisualFormat;      // Which format was generated
  elements: { id: string; type: string; label?: string; imageUrl?: string; position?: any; size?: any; quality?: number }[];
  progressiveElements: ParsedSVGElement[]; // Elements extracted during streaming
  error: string | null;
  metadata: {
    query: string;
    style: string;
    audience: string;
    width?: number;
    height?: number;
  } | null;
}

export interface UseStreamingVisualReturn extends StreamingVisualState {
  startStream: (query: string, options?: StreamOptions) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  isStreaming: boolean;
  // Progressive rendering callback
  onProgressiveElement: (callback: (element: ParsedSVGElement) => void) => void;
}

export interface StreamOptions {
  style?: 'cartoon' | 'modern' | 'professional' | 'minimal';
  audience?: 'kid' | 'teen' | 'adult' | 'professional';
  width?: number;
  height?: number;
  // Format selection
  format?: VisualFormat;     // 'react' for animated, 'svg' for static
  // Progressive rendering options (SVG only)
  enableProgressive?: boolean;
  renderOffsetX?: number;
  renderOffsetY?: number;
}

const initialState: StreamingVisualState = {
  phase: 'idle',
  explanation: '',
  code: '',
  svgCode: null,
  reactCode: null,
  format: 'react',  // Default to React for better visuals
  elements: [],
  progressiveElements: [],
  error: null,
  metadata: null,
};

export function useStreamingVisual(): UseStreamingVisualReturn {
  const [state, setState] = useState<StreamingVisualState>(initialState);
  const [isStreaming, setIsStreaming] = useState(false); // ✅ Fix: Use state for reactivity
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false); // Keep ref for loop control (non-reactive)
  const parserStateRef = useRef<SVGParserState>({ elements: [] });
  const progressiveCallbackRef = useRef<((element: ParsedSVGElement) => void) | null>(null);
  
  // Register callback for progressive element rendering
  const onProgressiveElement = useCallback((callback: (element: ParsedSVGElement) => void) => {
    progressiveCallbackRef.current = callback;
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isStreamingRef.current = false;
    setIsStreaming(false); // ✅ Fix: Update state
    setState(prev => ({ ...prev, phase: 'idle' }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState(initialState);
    parserStateRef.current = { elements: [] };
  }, [cancel]);

  const startStream = useCallback(async (query: string, options: StreamOptions = {}) => {
    // Cancel any existing stream
    cancel();

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    isStreamingRef.current = true;
    setIsStreaming(true);
    
    // Use image generation system with 500 workers
    const format: VisualFormat = 'react'; // Keep for backward compat, but will receive images
    const apiEndpoint = '/api/visual/orchestrate';  // Multi-worker image generation
    
    // Reset parser for progressive rendering
    parserStateRef.current = { elements: [] };
    const enableProgressive = options.enableProgressive !== false;

    // Reset state and start explaining phase
    setState({
      ...initialState,
      phase: 'explaining',
      format,
      metadata: {
        query,
        style: options.style || 'modern',
        audience: options.audience || 'adult',
        width: options.width || (format === 'react' ? 320 : 400),
        height: options.height || (format === 'react' ? 240 : 300),
      },
    });

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          style: options.style,
          audience: options.audience,
          width: options.width || (format === 'react' ? 320 : 400),
          height: options.height || (format === 'react' ? 240 : 300),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (isStreamingRef.current) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Parse SSE events
          const eventBoundary = '\n\n';
          let boundaryIndex: number;
          
          while ((boundaryIndex = buffer.indexOf(eventBoundary)) !== -1) {
            const line = buffer.slice(0, boundaryIndex);
            buffer = buffer.slice(boundaryIndex + eventBoundary.length);

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'reasoning':
                    // Show Master AI's reasoning/thinking process
                    // Like DeepSeek R1 - shows what AI is doing
                    setState(prev => ({
                      ...prev,
                      phase: 'planning',
                      explanation: prev.explanation + data.text + '\n'
                    }));
                    break;

                  case 'status':
                    // Status updates from orchestrator
                    setState(prev => ({
                      ...prev,
                      phase: data.phase === 'optimizing' ? 'optimizing' : 
                             data.phase === 'planning' ? 'planning' : 
                             data.phase === 'generating' ? 'generating' : 'coding',
                      explanation: prev.explanation + (data.message || ''),
                    }));
                    break;

                  case 'plan':
                    // Master AI plan received
                    setState(prev => ({
                      ...prev,
                      explanation: `Generating ${data.data.totalVisuals} visuals...`,
                    }));
                    break;

                  case 'visual':
                    // Individual image received from worker
                    const imageData = data.data;
                    
                    // Store image URL in state (will be used by canvas to display)
                    setState(prev => ({
                      ...prev,
                      phase: 'coding',
                      // Store images in elements array for canvas display
                      elements: [...prev.elements, {
                        id: `image-${imageData.taskId}`,
                        type: 'image',
                        imageUrl: imageData.imageUrl,
                        position: imageData.position,
                        size: imageData.size,
                        quality: imageData.quality
                      }],
                    }));
                    
                    // Call progressive callback for immediate rendering
                    if (progressiveCallbackRef.current) {
                      progressiveCallbackRef.current({
                        id: `image-${imageData.taskId}`,
                        type: 'image',
                        imageUrl: imageData.imageUrl
                      });
                    }
                    break;

                  case 'progress':
                    // Progress updates
                    // Just for logging, state updates handled by 'visual' events
                    break;

                  case 'text':
                    // Text overlay elements
                    // Store for canvas display
                    break;

                  case 'voice':
                    // Voice narration data
                    // Store for playback
                    break;

                  case 'timeline':
                    // Highlight timeline
                    // Store for synchronized highlighting
                    break;

                  case 'complete':
                    // All images generated
                    setState(prev => ({
                      ...prev,
                      phase: 'complete',
                      explanation: `Generated ${prev.elements.length} images successfully`,
                    }));
                    
                    logger.info('StreamingVisual: Image generation complete', {
                      imageCount: data.data?.totalVisuals || 0,
                      totalTime: data.data?.totalTime || 0
                    });
                    
                    isStreamingRef.current = false;
                    setIsStreaming(false);
                    break;

                  case 'error':
                    setState(prev => ({
                      ...prev,
                      phase: 'error',
                      error: data.text,
                    }));
                    isStreamingRef.current = false;
                    setIsStreaming(false);
                    break;
                }
              } catch (parseError) {
                // Log SSE parsing errors instead of silently swallowing
                logger.warn('StreamingVisual: Failed to parse SSE event', parseError);
              }
            }
          }
        }
      } finally {
        // Always release the reader lock to prevent memory leaks
        try {
          reader.releaseLock();
        } catch {
          // Ignore if already released
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: error instanceof Error ? error.message : 'Stream failed',
      }));
    } finally {
      isStreamingRef.current = false;
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [cancel]);

  return {
    ...state,
    startStream,
    cancel,
    reset,
    isStreaming, // ✅ Fix: Use state value for UI reactivity
    onProgressiveElement,
  };
}

export default useStreamingVisual;
