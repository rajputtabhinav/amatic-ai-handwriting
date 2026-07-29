/**
 * Multi-Visual Generation Hook
 * 
 * Client-side hook that connects to Master AI orchestration endpoint.
 * Receives streaming results for 5-500 visuals with text and voice.
 * 
 * Replaces use-streaming-visual.ts with multi-visual support.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { 
  VisualResult, 
  TextElement, 
  HighlightTimeline,
  WordTimestamp,
  GenerationProgress
} from '@/types/master-plan';
import { logger } from '@/lib/logger';

export type MultiVisualPhase = 'idle' | 'planning' | 'generating' | 'narrating' | 'complete' | 'error';

export interface MultiVisualState {
  phase: MultiVisualPhase;
  visuals: VisualResult[];
  textElements: TextElement[];
  voiceAudioUrl: string | null;
  voiceDuration: number;
  wordTimestamps: WordTimestamp[];
  timeline: HighlightTimeline | null;
  progress: GenerationProgress;
  error: string | null;
  metadata: {
    query: string;
    totalVisuals: number;
    textRatio: number;
    contentType: string;
  } | null;
}

export interface UseMultiVisualReturn extends MultiVisualState {
  generate: (query: string, options?: GenerateOptions) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  isGenerating: boolean;
}

export interface GenerateOptions {
  maxVisuals?: number;  // Limit for testing
}

const initialState: MultiVisualState = {
  phase: 'idle',
  visuals: [],
  textElements: [],
  voiceAudioUrl: null,
  voiceDuration: 0,
  wordTimestamps: [],
  timeline: null,
  progress: {
    completed: 0,
    total: 0,
    percentage: 0,
    currentPhase: 'planning',
    estimatedTimeRemaining: 0
  },
  error: null,
  metadata: null
};

/**
 * Multi-Visual Generation Hook
 */
export function useMultiVisualGeneration(): UseMultiVisualReturn {
  const [state, setState] = useState<MultiVisualState>(initialState);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef(false);
  
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isGeneratingRef.current = false;
    setIsGenerating(false);
    setState(prev => ({ ...prev, phase: 'idle' }));
  }, []);
  
  const reset = useCallback(() => {
    cancel();
    setState(initialState);
  }, [cancel]);
  
  const generate = useCallback(async (query: string, options: GenerateOptions = {}) => {
    // Cancel any existing generation
    cancel();
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    isGeneratingRef.current = true;
    setIsGenerating(true);
    
    // Reset state
    setState({
      ...initialState,
      phase: 'planning',
      metadata: {
        query,
        totalVisuals: 0,
        textRatio: 0,
        contentType: 'unknown'
      }
    });
    
    try {
      const response = await fetch('/api/visual/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          maxVisuals: options.maxVisuals
        }),
        signal: abortControllerRef.current.signal
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
        while (isGeneratingRef.current) {
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
                  case 'status':
                    setState(prev => ({
                      ...prev,
                      phase: data.phase || prev.phase
                    }));
                    logger.info(`[MultiVisual] Status: ${data.message}`);
                    break;
                  
                  case 'plan':
                    setState(prev => ({
                      ...prev,
                      phase: 'generating',
                      metadata: {
                        query,
                        totalVisuals: data.data.totalVisuals,
                        textRatio: data.data.textRatio,
                        contentType: data.data.contentType
                      },
                      progress: {
                        ...prev.progress,
                        total: data.data.totalVisuals,
                        currentPhase: 'generating'
                      }
                    }));
                    logger.info(`[MultiVisual] Plan received: ${data.data.totalVisuals} visuals`);
                    break;
                  
                  case 'visual':
                    setState(prev => ({
                      ...prev,
                      visuals: [...prev.visuals, data.data]
                    }));
                    break;
                  
                  case 'progress':
                    setState(prev => ({
                      ...prev,
                      progress: {
                        ...prev.progress,
                        completed: data.data.completed,
                        total: data.data.total,
                        percentage: data.data.percentage,
                        currentPhase: 'generating'
                      }
                    }));
                    break;
                  
                  case 'text':
                    setState(prev => ({
                      ...prev,
                      textElements: [...prev.textElements, data.data]
                    }));
                    break;
                  
                  case 'voice':
                    setState(prev => ({
                      ...prev,
                      phase: 'narrating',
                      voiceAudioUrl: data.data.audioUrl,
                      voiceDuration: data.data.duration,
                      wordTimestamps: data.data.wordTimestamps || [],
                      progress: {
                        ...prev.progress,
                        currentPhase: 'narrating'
                      }
                    }));
                    logger.info(`[MultiVisual] Voice ready: ${data.data.duration}s`);
                    break;
                  
                  case 'timeline':
                    setState(prev => ({
                      ...prev,
                      timeline: data.data
                    }));
                    logger.info(`[MultiVisual] Timeline received: ${data.data.points?.length || 0} points`);
                    break;
                  
                  case 'complete':
                    setState(prev => ({
                      ...prev,
                      phase: 'complete',
                      progress: {
                        ...prev.progress,
                        currentPhase: 'complete',
                        percentage: 100,
                        estimatedTimeRemaining: 0
                      }
                    }));
                    isGeneratingRef.current = false;
                    setIsGenerating(false);
                    logger.info(`[MultiVisual] Generation complete!`);
                    break;
                  
                  case 'error':
                    setState(prev => ({
                      ...prev,
                      phase: 'error',
                      error: data.message
                    }));
                    isGeneratingRef.current = false;
                    setIsGenerating(false);
                    break;
                }
              } catch (parseError) {
                logger.warn('[MultiVisual] Failed to parse SSE event', parseError);
              }
            }
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // Ignore if already released
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        logger.info('[MultiVisual] Generation cancelled');
        return;
      }
      
      logger.error('[MultiVisual] Generation error:', error);
      
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: error instanceof Error ? error.message : 'Generation failed'
      }));
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [cancel]);
  
  return {
    ...state,
    generate,
    cancel,
    reset,
    isGenerating
  };
}

export default useMultiVisualGeneration;

