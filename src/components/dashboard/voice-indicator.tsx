'use client';

import { motion } from 'framer-motion';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import { VoiceStatus } from '@/hooks/use-realtime-voice';

interface VoiceIndicatorProps {
  status: VoiceStatus;
  className?: string;
}

/**
 * Voice Indicator Component
 * Shows current voice conversation status with animations
 */
export function VoiceIndicator({ status, className = '' }: VoiceIndicatorProps) {
  const getIndicatorContent = () => {
    switch (status) {
      case 'listening':
        return {
          icon: <Mic className="w-5 h-5" />,
          text: 'Listening...',
          color: 'bg-green-500',
          pulse: true
        };
      case 'speaking':
        return {
          icon: <Volume2 className="w-5 h-5" />,
          text: 'AI Speaking',
          color: 'bg-blue-500',
          pulse: true
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: 'Thinking...',
          color: 'bg-yellow-500',
          pulse: false
        };
      case 'inactive':
      default:
        return {
          icon: <Mic className="w-5 h-5 opacity-50" />,
          text: 'Voice Inactive',
          color: 'bg-gray-400',
          pulse: false
        };
    }
  };

  const content = getIndicatorContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`voice-indicator flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Icon with pulsing animation */}
      <div className="relative">
        <motion.div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${content.color} text-white`}
          animate={content.pulse ? {
            scale: [1, 1.1, 1],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {content.icon}
        </motion.div>
        
        {/* Pulsing ring effect */}
        {content.pulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${content.color} opacity-30`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </div>

      {/* Status text */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {content.text}
      </span>
    </motion.div>
  );
}

