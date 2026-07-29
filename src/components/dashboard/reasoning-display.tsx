'use client';

/**
 * Reasoning Display Component
 * 
 * Shows live AI thinking/reasoning in real-time.
 * Displays the thought process while illustrations load in background.
 */

import React, { useState, useEffect, useRef } from 'react';
import { streamReasoning, formatReasoningText, extractReasoningInsights } from '@/lib/reasoning/reasoning-stream';

export interface ReasoningDisplayProps {
  query?: string;
  onReasoningComplete?: (reasoning: string, content: string) => void;
  onInsightsExtracted?: (insights: { audience: string | null; topic: string | null; visualElements: string[] }) => void;
  isActive?: boolean;
  className?: string;
  showThinkingAnimation?: boolean;
}

interface ReasoningState {
  isThinking: boolean;
  reasoningText: string;
  contentText: string;
  isComplete: boolean;
  error: string | null;
  duration: number;
}

export function ReasoningDisplay({
  query,
  onReasoningComplete,
  onInsightsExtracted,
  isActive = true,
  className = '',
  showThinkingAnimation = true
}: ReasoningDisplayProps) {
  const [state, setState] = useState<ReasoningState>({
    isThinking: false,
    reasoningText: '',
    contentText: '',
    isComplete: false,
    error: null,
    duration: 0
  });
  
  const reasoningRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  // Auto-scroll to bottom as new text arrives
  useEffect(() => {
    if (reasoningRef.current) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [state.reasoningText]);

  // Stream reasoning when query changes
  useEffect(() => {
    if (!query || !isActive) return;

    setState({
      isThinking: true,
      reasoningText: '',
      contentText: '',
      isComplete: false,
      error: null,
      duration: 0
    });

    startTimeRef.current = Date.now();

    const runReasoning = async () => {
      try {
        await streamReasoning(query, {
          onReasoning: (text) => {
            setState(prev => ({
              ...prev,
              reasoningText: prev.reasoningText + text,
              duration: Date.now() - startTimeRef.current
            }));
          },
          onContent: (text) => {
            setState(prev => ({
              ...prev,
              contentText: prev.contentText + text,
              duration: Date.now() - startTimeRef.current
            }));
          },
          onComplete: (reasoning, content) => {
            setState(prev => ({
              ...prev,
              isThinking: false,
              isComplete: true,
              duration: Date.now() - startTimeRef.current
            }));
            
            // Extract insights
            const insights = extractReasoningInsights(reasoning);
            onInsightsExtracted?.(insights);
            
            // Callback
            onReasoningComplete?.(reasoning, content);
          },
          onError: (error) => {
            setState(prev => ({
              ...prev,
              isThinking: false,
              error: error.message,
              duration: Date.now() - startTimeRef.current
            }));
          }
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState(prev => ({
          ...prev,
          isThinking: false,
          error: err.message,
          duration: Date.now() - startTimeRef.current
        }));
      }
    };

    runReasoning();
  }, [query, isActive, onReasoningComplete, onInsightsExtracted]);

  // Format the reasoning text for display
  const formattedReasoning = formatReasoningText(state.reasoningText);

  return (
    <div className={`reasoning-display ${className}`}>
      {/* Thinking indicator */}
      {state.isThinking && showThinkingAnimation && (
        <div className="flex items-center gap-2 mb-3 text-primary">
          <div className="thinking-animation flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-medium">Thinking...</span>
        </div>
      )}

      {/* Reasoning text */}
      {state.reasoningText && (
        <div 
          ref={reasoningRef}
          className="reasoning-text bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto"
        >
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xl">💭</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              AI is thinking...
            </span>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {formattedReasoning}
            {state.isThinking && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            )}
          </p>
        </div>
      )}

      {/* Content/summary (after reasoning) */}
      {state.contentText && state.isComplete && (
        <div className="content-text mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {state.contentText}
          </p>
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <div className="error-display mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* Duration indicator */}
      {state.isComplete && (
        <div className="mt-2 text-xs text-gray-400">
          Thought for {(state.duration / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}

/**
 * Compact reasoning indicator
 */
export function ReasoningIndicator({
  isThinking = false,
  text = 'Thinking...',
  className = ''
}: {
  isThinking?: boolean;
  text?: string;
  className?: string;
}) {
  if (!isThinking) return null;

  return (
    <div className={`reasoning-indicator flex items-center gap-2 ${className}`}>
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
      </div>
      <span className="text-xs text-gray-500">{text}</span>
    </div>
  );
}

/**
 * Reasoning bubble for chat-like display
 */
export function ReasoningBubble({
  reasoning,
  isComplete = false,
  className = ''
}: {
  reasoning: string;
  isComplete?: boolean;
  className?: string;
}) {
  const formatted = formatReasoningText(reasoning);

  return (
    <div className={`reasoning-bubble ${className}`}>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">💭</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isComplete ? 'Thought Process' : 'Thinking...'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
          &ldquo;{formatted}&rdquo;
          {!isComplete && (
            <span className="inline-block w-1.5 h-3 bg-primary/50 animate-pulse ml-0.5" />
          )}
        </p>
      </div>
    </div>
  );
}

export default ReasoningDisplay;

