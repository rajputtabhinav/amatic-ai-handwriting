/**
 * AI Tutor Interface
 * 
 * Complete AI tutoring experience combining:
 * - Voice narration synchronized with visuals
 * - 2D/3D visualization routing
 * - Adaptive difficulty
 * - Progress tracking
 * - Interactive learning modes
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { routeVisualization } from '@/lib/routing/visualization-router';
import { LiveTutorMode } from './live-tutor';
// ComponentCanvas imported in canvas layer
// TODO: Re-enable when dynamic-component is implemented
// import { DynamicComponentRenderer } from './dynamic-component';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface AITutorInterfaceProps {
  query: string;
  onComplete?: () => void;
}

function ComponentPreview({ code }: { code: string }) {
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
      {code}
    </pre>
  );
}

export function AITutorInterface({ query, onComplete }: AITutorInterfaceProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [visualizationType, setVisualizationType] = useState<'2d-component' | '3d-scene'>('2d-component');
  const [componentCode, setComponentCode] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Route and generate visualization
  useEffect(() => {
    const initializeVisualization = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Route to 2D or 3D
        const decision = await routeVisualization(query);
        setVisualizationType(decision.type);

        logger.info(`Visualization routing: ${decision.type} - ${decision.rationale}`);

        // Generate appropriate visualization
        if (decision.type === '3d-scene') {
          // Generate 3D scene
          await generate3DVisualization(query, decision.sceneType!);
        } else {
          // Generate 2D component
          await generate2DComponent(query);
        }

        setIsLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate visualization';
        setError(errorMsg);
        setIsLoading(false);
        logger.error('Visualization generation error', err);
        toast.error(errorMsg);
      }
    };

    initializeVisualization();
  }, [query]);

  /**
   * Generate 2D component
   */
  const generate2DComponent = async (query: string) => {
    const response = await fetch('/api/visual/stream-component', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate component');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response stream');

    let fullCode = '';
    let fullExplanation = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'explanation') {
            fullExplanation = data.full;
            setExplanation(fullExplanation);
          } else if (data.type === 'code') {
            fullCode = data.full;
            setComponentCode(fullCode);
          } else if (data.type === 'done') {
            setComponentCode(data.code);
            setExplanation(data.explanation);
          } else if (data.type === 'error') {
            throw new Error(data.text);
          }
        }
      }
    }
  };

  /**
   * Generate 3D scene
   */
  const generate3DVisualization = async (query: string, sceneType: string) => {
    // For now, use fallback 3D templates
    // Full AI generation can be added later
    const { generate3DScene } = await import('@/lib/3d/scene-generator');
    const scene = await generate3DScene(query, sceneType as any);
    setComponentCode(scene.code);
    setExplanation(`Exploring ${query} in 3D space. Rotate, zoom, and interact with the visualization.`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
        <p className="ml-4 text-gray-600 dark:text-gray-400">
          Generating {visualizationType === '3d-scene' ? '3D' : 'interactive'} visualization...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Visualization Error
        </h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render visualization
  return (
    <div className="ai-tutor-interface">
      {/* Explanation */}
      {explanation && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg"
        >
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {explanation}
          </p>
        </motion.div>
      )}

      {/* Visualization Type Badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
          {visualizationType === '3d-scene' ? '🔮 3D Visualization' : '⚡ Interactive Component'}
        </span>
      </div>

      {/* Live Tutor Mode with Visualization */}
      {user && componentCode && (
        <LiveTutorMode
          concept={query}
          userId={user.id}
          visualComponent={
            <div className="visualization-container bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
              <ComponentPreview code={componentCode} />
            </div>
          }
          totalSteps={4} // Default, will be extracted from component
          onStepChange={(step) => {
            logger.info(`Step changed to ${step}`);
          }}
        />
      )}

      {/* Completion callback */}
      {onComplete && (
        <div className="mt-6 text-center">
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Complete Learning Session
          </button>
        </div>
      )}
    </div>
  );
}

export default AITutorInterface;

