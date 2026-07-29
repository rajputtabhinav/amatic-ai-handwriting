/**
 * Generation Progress Indicator
 * 
 * Shows real-time progress during multi-visual generation.
 * Displays current phase, completion percentage, and estimated time.
 */

'use client';

import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GenerationProgress } from '@/types/master-plan';

export interface GenerationProgressProps {
  progress: GenerationProgress;
  className?: string;
}

export function GenerationProgressIndicator({
  progress,
  className = ''
}: GenerationProgressProps) {
  
  const getPhaseDisplay = () => {
    switch (progress.currentPhase) {
      case 'planning':
        return {
          icon: Loader2,
          text: 'Master AI analyzing query...',
          color: '#8B5CF6'
        };
      case 'generating':
        return {
          icon: Loader2,
          text: `Generating visuals: ${progress.completed}/${progress.total}`,
          color: '#3B82F6'
        };
      case 'narrating':
        return {
          icon: Loader2,
          text: 'Preparing narration...',
          color: '#10B981'
        };
      case 'complete':
        return {
          icon: CheckCircle2,
          text: 'Generation complete!',
          color: '#10B981'
        };
    }
  };
  
  const phase = getPhaseDisplay();
  const Icon = phase.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-2xl p-6 min-w-[400px] border border-gray-200">
        {/* Phase indicator */}
        <div className="flex items-center gap-3 mb-4">
          <Icon 
            className={progress.currentPhase === 'complete' ? '' : 'animate-spin'} 
            style={{ color: phase.color }}
            size={24}
          />
          <div>
            <div className="font-semibold text-gray-900">{phase.text}</div>
            {progress.currentPhase === 'generating' && (
              <div className="text-sm text-gray-500">
                {Math.round(progress.percentage)}% • {Math.round(progress.estimatedTimeRemaining)}s remaining
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        {progress.currentPhase === 'generating' && (
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        
        {/* Statistics */}
        {progress.currentPhase === 'generating' && progress.total > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-blue-600">{progress.completed}</div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{progress.total - progress.completed}</div>
              <div className="text-gray-500">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-violet-600">{progress.total}</div>
              <div className="text-gray-500">Total</div>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {progress.currentPhase === 'complete' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center text-green-600 font-medium"
          >
            ✓ {progress.total} visuals ready!
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default GenerationProgressIndicator;

