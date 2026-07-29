/**
 * Live Tutor Mode
 * 
 * AI watches user actions and provides real-time feedback.
 * Combines voice narration, visual guidance, and adaptive responses.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { createVoiceTutorSync } from '@/lib/tutoring/voice-sync';
import { AdaptiveTutor, InteractionTracker } from '@/lib/tutoring/adaptive-learning';
import { useProgressTracker } from '@/lib/tutoring/progress-tracker';

export type TutorMode = 'watch' | 'try' | 'explore';

export interface UserAction {
  type: 'click' | 'input' | 'drag' | 'complete';
  target: string;
  value?: any;
  timestamp: number;
}

export interface TutorFeedback {
  type: 'success' | 'hint' | 'correction' | 'encouragement';
  message: string;
  showVisualHint?: boolean;
}

interface LiveTutorProps {
  concept: string;
  userId: string;
  visualComponent: React.ReactNode;
  totalSteps: number;
  onStepChange?: (step: number) => void;
}

export function LiveTutorMode({
  concept,
  userId,
  visualComponent,
  totalSteps,
  onStepChange,
}: LiveTutorProps) {
  const [mode, setMode] = useState<TutorMode>('watch');
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSync, setVoiceSync] = useState<any>(null);
  
  // Adaptive learning
  const [adaptiveTutor] = useState(() => new AdaptiveTutor());
  const [tracker] = useState(() => new InteractionTracker(totalSteps));
  const progressTracker = useProgressTracker(userId, concept);

  // Initialize voice sync
  useEffect(() => {
    const initVoiceSync = async () => {
      const sync = await createVoiceTutorSync(async (step) => {
        setStep(step);
        onStepChange?.(step);
      });
      setVoiceSync(sync);
    };

    initVoiceSync();
  }, [onStepChange]);

  // Start tracking when component mounts
  useEffect(() => {
    tracker.startStep();
    
    return () => {
      // Save progress on unmount
      const metrics = tracker.getMetrics();
      const analysis = adaptiveTutor.analyzeUnderstanding(metrics);
      
      progressTracker.updateProgress({
        understandingScore: Math.round(
          metrics.interactionQuality * 100
        ),
        difficultyLevel: analysis.difficulty,
        completedSteps: Array.from({ length: step + 1 }, (_, i) => i),
        timeSpentSeconds: Math.round(metrics.timePerStep * (step + 1)),
      });
    };
  }, []);

  /**
   * Handle user action in "try" mode
   */
  const handleUserAction = useCallback(
    async (action: UserAction) => {
      setIsListening(true);

      // Evaluate action
      const evaluation = await evaluateUserAction(action, step, concept);

      // Record action
      tracker.recordAction(evaluation.correct);

      // Provide feedback
      const newFeedback: TutorFeedback = {
        type: evaluation.correct ? 'success' : 'hint',
        message: evaluation.message,
        showVisualHint: !evaluation.correct,
      };

      setFeedback(newFeedback);

      // Speak feedback
      if (voiceSync) {
        await voiceSync.speakText(evaluation.message);
      }

      // Advance step if correct
      if (evaluation.correct) {
        tracker.completeStep();
        setTimeout(() => {
          setStep((s) => Math.min(s + 1, totalSteps - 1));
          tracker.startStep();
          setFeedback(null);
        }, 2000);
      }

      setIsListening(false);
    },
    [step, concept, voiceSync, tracker, totalSteps]
  );

  /**
   * Handle mode change
   */
  const handleModeChange = async (newMode: TutorMode) => {
    setMode(newMode);

    // Narrate mode change
    if (voiceSync) {
      const modeMessages = {
        watch: `Watch mode: I'll show you how ${concept} works step by step.`,
        try: `Try mode: Now you try it! I'll guide you if you need help.`,
        explore: `Explore mode: Feel free to explore at your own pace.`,
      };

      await voiceSync.speakText(modeMessages[newMode]);
    }
  };

  return (
    <div className="live-tutor-container">
      {/* Voice Status Indicator */}
      <div className="voice-status-bar flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg mb-4">
        <motion.div
          animate={{
            scale: isListening ? [1, 1.2, 1] : 1,
          }}
          transition={{
            repeat: isListening ? Infinity : 0,
            duration: 1,
          }}
        >
          {isListening ? (
            <Volume2 className="h-5 w-5 text-indigo-600" />
          ) : (
            <Mic className="h-5 w-5 text-gray-400" />
          )}
        </motion.div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isListening ? 'AI is speaking...' : 'AI Tutor Ready'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Learning: {concept}
          </span>
          <span className="text-sm text-gray-500">
            Step {step + 1} / {totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Mode Selector */}
      <div className="mode-selector flex gap-2 mb-4">
        {(['watch', 'try', 'explore'] as TutorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mode === m
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {m === 'watch' && '👀 Watch'}
            {m === 'try' && '✏️ You Try'}
            {m === 'explore' && '🔍 Explore'}
          </button>
        ))}
      </div>

      {/* Visual Component */}
      <div className="visual-component-container mb-4">{visualComponent}</div>

      {/* Live Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`feedback-panel p-4 rounded-lg ${
              feedback.type === 'success'
                ? 'bg-green-50 dark:bg-green-950 border border-green-200'
                : feedback.type === 'hint'
                  ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200'
                  : 'bg-amber-50 dark:bg-amber-950 border border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {feedback.type === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              {feedback.type === 'hint' && (
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              {feedback.type === 'correction' && (
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {feedback.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text based on mode */}
      <div className="helper-text text-center text-sm text-gray-500 mt-4">
        {mode === 'watch' &&
          'Watch as the AI teaches you step by step with voice narration'}
        {mode === 'try' &&
          'Try interacting with the visualization - AI will guide you'}
        {mode === 'explore' && 'Explore freely - click on elements to learn more'}
      </div>
    </div>
  );
}

/**
 * Evaluate user action
 */
async function evaluateUserAction(
  _action: UserAction,
  _currentStep: number,
  _concept: string
): Promise<{ correct: boolean; message: string }> {
  // Simple evaluation logic (can be enhanced with AI)
  
  // For now, any interaction is considered progress
  const correct = true;
  
  const messages = {
    success: [
      'Excellent! You got it!',
      'Perfect! You understand this concept.',
      'Great job! Moving to the next step.',
      'Well done! You\'re making great progress.',
    ],
    hint: [
      'Not quite. Try clicking on the highlighted element.',
      'Close! Think about what happens in this step.',
      'Let me give you a hint: focus on the main component.',
    ],
  };

  const messageList = correct ? messages.success : messages.hint;
  const message = messageList[Math.floor(Math.random() * messageList.length)];

  return { correct, message };
}

export default LiveTutorMode;

