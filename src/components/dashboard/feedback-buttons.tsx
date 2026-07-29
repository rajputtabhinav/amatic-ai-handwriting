'use client';

/**
 * Feedback Buttons Component
 * 
 * Thumbs up/down buttons for user feedback.
 * Collects quality data for model training.
 */

import React, { useState, useCallback } from 'react';
import { logFeedback } from '@/lib/training/data-collector';

export interface FeedbackButtonsProps {
  logId: string;
  userId?: string;
  onFeedback?: (type: 'thumbs_up' | 'thumbs_down') => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type FeedbackState = 'none' | 'thumbs_up' | 'thumbs_down' | 'submitting';

export function FeedbackButtons({
  logId,
  userId,
  onFeedback,
  showLabels = false,
  size = 'md',
  className = ''
}: FeedbackButtonsProps) {
  const [state, setState] = useState<FeedbackState>('none');
  const [showThanks, setShowThanks] = useState(false);

  const sizeClasses = {
    sm: 'p-1 text-sm',
    md: 'p-2',
    lg: 'p-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleFeedback = useCallback(async (type: 'thumbs_up' | 'thumbs_down') => {
    if (state !== 'none') return;

    setState('submitting');

    try {
      await logFeedback({
        logId,
        type,
        userId
      });

      setState(type);
      setShowThanks(true);
      onFeedback?.(type);

      // Hide thanks message after 2 seconds
      setTimeout(() => setShowThanks(false), 2000);
    } catch (error) {
      console.error('Feedback error:', error);
      setState('none');
    }
  }, [logId, userId, state, onFeedback]);

  const isDisabled = state !== 'none' && state !== 'submitting';

  return (
    <div className={`feedback-buttons flex items-center gap-2 ${className}`}>
      {/* Thumbs up */}
      <button
        onClick={() => handleFeedback('thumbs_up')}
        disabled={isDisabled || state === 'submitting'}
        className={`
          ${sizeClasses[size]}
          rounded-lg
          transition-all
          ${state === 'thumbs_up'
            ? 'bg-green-100 text-green-600 border-2 border-green-500'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-green-600'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${state === 'submitting' ? 'animate-pulse' : ''}
          flex items-center gap-1
        `}
        title="This was helpful"
      >
        <svg 
          viewBox="0 0 24 24" 
          className={iconSizes[size]}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        {showLabels && <span>Helpful</span>}
      </button>

      {/* Thumbs down */}
      <button
        onClick={() => handleFeedback('thumbs_down')}
        disabled={isDisabled || state === 'submitting'}
        className={`
          ${sizeClasses[size]}
          rounded-lg
          transition-all
          ${state === 'thumbs_down'
            ? 'bg-red-100 text-red-600 border-2 border-red-500'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-600'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${state === 'submitting' ? 'animate-pulse' : ''}
          flex items-center gap-1
        `}
        title="Not helpful"
      >
        <svg 
          viewBox="0 0 24 24" 
          className={iconSizes[size]}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
        {showLabels && <span>Not helpful</span>}
      </button>

      {/* Thanks message */}
      {showThanks && (
        <span className="text-xs text-gray-500 animate-fadeIn">
          Thanks for your feedback!
        </span>
      )}
    </div>
  );
}

/**
 * Detailed feedback with optional comment
 */
export function DetailedFeedback({
  logId,
  userId,
  onSubmit,
  className = ''
}: {
  logId: string;
  userId?: string;
  onSubmit?: (feedback: { type: string; text?: string; category?: string }) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'clarity', label: 'Clarity' },
    { value: 'relevance', label: 'Relevance' },
    { value: 'animation', label: 'Animation' },
    { value: 'voice', label: 'Voice' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    if (!type) return;

    setIsSubmitting(true);

    try {
      await logFeedback({
        logId,
        type,
        text: text || undefined,
        category: category || undefined,
        userId
      });

      setSubmitted(true);
      onSubmit?.({ type, text, category });
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`p-4 bg-green-50 rounded-lg text-center ${className}`}>
        <p className="text-green-600 font-medium">Thank you for your feedback!</p>
        <p className="text-sm text-green-500 mt-1">Your input helps us improve.</p>
      </div>
    );
  }

  return (
    <div className={`detailed-feedback ${className}`}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Was this helpful?
        </button>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <p className="text-sm font-medium">How was this explanation?</p>
          
          {/* Quick feedback buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setType('thumbs_up')}
              className={`
                flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2
                ${type === 'thumbs_up'
                  ? 'bg-green-100 text-green-600 border-2 border-green-500'
                  : 'bg-white border border-gray-200 hover:bg-green-50 text-gray-600'}
              `}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              Helpful
            </button>
            <button
              onClick={() => setType('thumbs_down')}
              className={`
                flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2
                ${type === 'thumbs_down'
                  ? 'bg-red-100 text-red-600 border-2 border-red-500'
                  : 'bg-white border border-gray-200 hover:bg-red-50 text-gray-600'}
              `}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              Not helpful
            </button>
          </div>

          {/* Category */}
          {type && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category (optional)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Comment */}
          {type && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Additional comments (optional)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell us more..."
                className="w-full p-2 border rounded-lg text-sm resize-none"
                rows={2}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!type || isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackButtons;

