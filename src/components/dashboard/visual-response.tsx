'use client';

/**
 * Visual Response Component (Legacy)
 * 
 * NOTE: This component is deprecated in favor of CanvasAIResponse
 * which adds elements directly to the canvas for user interaction.
 * 
 * This component is kept for backward compatibility and shows
 * a simple static preview instead of a video player.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ReasoningDisplay, ReasoningIndicator } from './reasoning-display';
import { SimplePhysicsCanvas } from './physics-canvas';
import { 
  analyzeQueryClient, 
  generateSVGClient, 
  generateTimelineClient 
} from '@/lib/visual/client-api';
import type { GeneratedSVG } from '@/lib/visual/client-api';
import type { GeneratedTimeline } from '@/lib/visual/timeline-generator';
import type { DetailedQueryAnalysis } from '@/lib/visual/query-analyzer';
import { CheckCircle2 } from 'lucide-react';

export interface VisualResponseProps {
  query: string;
  onComplete?: (result: VisualResponseResult) => void;
  onError?: (error: Error) => void;
  autoPlay?: boolean;
  showReasoning?: boolean;
  className?: string;
}

export interface VisualResponseResult {
  query: string;
  analysis: DetailedQueryAnalysis;
  svg: GeneratedSVG;
  timeline: GeneratedTimeline;
  duration: number;
}

type ResponsePhase = 'idle' | 'analyzing' | 'reasoning' | 'generating-svg' | 'generating-timeline' | 'ready' | 'playing' | 'complete' | 'error';

interface ResponseState {
  phase: ResponsePhase;
  analysis: DetailedQueryAnalysis | null;
  reasoning: string;
  svg: GeneratedSVG | null;
  timeline: GeneratedTimeline | null;
  error: string | null;
  progress: number;
}

export function VisualResponse({
  query,
  onComplete,
  onError,
  autoPlay = true,
  showReasoning = true,
  className = ''
}: VisualResponseProps) {
  const [state, setState] = useState<ResponseState>({
    phase: 'idle',
    analysis: null,
    reasoning: '',
    svg: null,
    timeline: null,
    error: null,
    progress: 0
  });

  // Generate visual response
  const generateResponse = useCallback(async () => {
    if (!query) return;

    const startTime = Date.now();

    try {
      // Phase 1: Analyze query (uses server-side API)
      setState(prev => ({ ...prev, phase: 'analyzing', progress: 10 }));
      const analysis = await analyzeQueryClient(query);
      setState(prev => ({ ...prev, analysis, progress: 20 }));

      // Phase 2: Show reasoning (happens in parallel with SVG generation in UI)
      setState(prev => ({ ...prev, phase: 'reasoning', progress: 30 }));

      // Phase 3: Generate SVG (uses server-side API)
      setState(prev => ({ ...prev, phase: 'generating-svg', progress: 50 }));
      const svg = await generateSVGClient(query, {
        style: analysis.visualStyle,
        audience: analysis.audience,
        includePhysics: true
      });
      setState(prev => ({ ...prev, svg, progress: 70 }));

      // Phase 4: Generate timeline (uses server-side API)
      setState(prev => ({ ...prev, phase: 'generating-timeline', progress: 80 }));
      const timeline = await generateTimelineClient(query, svg.elements, {
        voiceStyle: analysis.voiceTone as 'casual' | 'professional' | 'enthusiastic' | 'calm',
        pacing: 'normal'
      });
      setState(prev => ({ ...prev, timeline, progress: 100, phase: 'ready' }));

      // Prepare result
      const result: VisualResponseResult = {
        query,
        analysis,
        svg,
        timeline,
        duration: Date.now() - startTime
      };

      // Auto-play if enabled
      if (autoPlay) {
        setState(prev => ({ ...prev, phase: 'playing' }));
      }

      onComplete?.(result);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({ ...prev, phase: 'error', error: err.message }));
      onError?.(err);
    }
  }, [query, autoPlay, onComplete, onError]);

  // Trigger generation when query changes
  useEffect(() => {
    if (query) {
      generateResponse();
    }
  }, [query, generateResponse]);

  // Handle reasoning complete
  const handleReasoningComplete = useCallback((reasoning: string) => {
    setState(prev => ({ ...prev, reasoning }));
  }, []);

  // Handle playback complete - kept for future timeline playback feature
  const _handlePlaybackComplete = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'complete' }));
  }, []);
  void _handlePlaybackComplete; // Silence unused warning

  // Render based on phase
  const renderContent = () => {
    switch (state.phase) {
      case 'idle':
        return (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <p>Ask a question to see a visual explanation</p>
          </div>
        );

      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <ReasoningIndicator isThinking={true} text="Analyzing your question..." />
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        );

      case 'reasoning':
      case 'generating-svg':
      case 'generating-timeline':
        return (
          <div className="flex flex-col gap-4">
            {/* Reasoning display */}
            {showReasoning && (
              <ReasoningDisplay
                query={query}
                isActive={state.phase === 'reasoning'}
                onReasoningComplete={handleReasoningComplete}
                className="mb-4"
              />
            )}
            
            {/* Progress indicator */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {state.phase === 'reasoning' && 'Thinking through the explanation...'}
                  {state.phase === 'generating-svg' && 'Creating visual illustration...'}
                  {state.phase === 'generating-timeline' && 'Building animation sequence...'}
                </p>
                <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Preview of SVG if available */}
            {state.svg && (
              <div className="opacity-50">
                <SimplePhysicsCanvas
                  svgCode={state.svg.code}
                  width={400}
                  height={300}
                  className="rounded-lg border"
                />
              </div>
            )}
          </div>
        );

      case 'ready':
      case 'playing':
      case 'complete':
        if (!state.svg || !state.analysis) {
          return <div className="text-red-500">Missing data</div>;
        }

        return (
          <div className="flex flex-col gap-4">
            {/* Static SVG preview (no video player) */}
            <div className="relative">
              <SimplePhysicsCanvas
                svgCode={state.svg.code}
                width={400}
                height={300}
                className="rounded-lg border shadow-md"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {state.analysis.audience} audience
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {state.analysis.topic}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                {state.svg.elements.length} elements
              </span>
            </div>
            
            {/* Note about new system */}
            <p className="text-xs text-gray-400 italic">
              Tip: Use the new Canvas AI mode to add interactive elements directly to your canvas!
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Generation Error</h4>
            <p className="text-sm text-red-600">{state.error}</p>
            <button
              onClick={generateResponse}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`visual-response ${className}`}>
      {renderContent()}
    </div>
  );
}

/**
 * Compact visual response for chat integration
 */
export function CompactVisualResponse({
  query,
  onComplete,
  className = ''
}: {
  query: string;
  onComplete?: (result: VisualResponseResult) => void;
  className?: string;
}) {
  return (
    <VisualResponse
      query={query}
      onComplete={onComplete}
      autoPlay={true}
      showReasoning={false}
      className={`max-w-lg ${className}`}
    />
  );
}

export default VisualResponse;

