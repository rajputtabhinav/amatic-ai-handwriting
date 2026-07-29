'use client';

/**
 * Onboarding Component
 * 
 * First-time user onboarding with:
 * - Welcome message
 * - Quick feature tour
 * - Visual AI introduction
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Wand2, 
  MessageSquare, 
  Mic, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
  className?: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Amatic.ai! ✨',
    description: 'Your AI-powered creative platform that transforms questions into visual explanations with voice.',
    icon: <Sparkles className="w-12 h-12 text-[#6366F1]" />,
  },
  {
    id: 'visual-ai',
    title: 'Visual AI Responses',
    description: 'Ask anything and get beautiful, animated visual explanations. Our AI creates custom illustrations in real-time!',
    icon: <Wand2 className="w-12 h-12 text-purple-500" />,
    highlight: 'visual-mode',
  },
  {
    id: 'voice',
    title: 'Voice Conversation',
    description: 'Click the mic button for hands-free conversation. The AI will speak responses with natural emotion.',
    icon: <Mic className="w-12 h-12 text-blue-500" />,
    highlight: 'voice-button',
  },
  {
    id: 'chat',
    title: 'Powerful Chat',
    description: 'Type your questions in the chat box. You can toggle between visual and text modes anytime.',
    icon: <MessageSquare className="w-12 h-12 text-green-500" />,
    highlight: 'chat-input',
  },
];

const STORAGE_KEY = 'amatic-onboarding-completed';

export function Onboarding({ onComplete, onSkip, className = '' }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    setTimeout(() => {
      onSkip?.();
      onComplete();
    }, 300);
  }, [onComplete, onSkip]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity ${className}`}>
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-6 bg-[#6366F1]' 
                  : index < currentStep
                  ? 'bg-[#6366F1]/50'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 pt-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`flex items-center gap-2 ${isFirstStep ? 'invisible' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <span className="text-sm text-gray-400">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Skip link */}
        <div className="pb-6 text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Reset onboarding state (for testing)
 */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if onboarding should be shown
    const completed = hasCompletedOnboarding();
    setShowOnboarding(!completed);
    setIsLoaded(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const restartOnboarding = useCallback(() => {
    resetOnboarding();
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    isLoaded,
    completeOnboarding,
    restartOnboarding,
  };
}

export default Onboarding;
