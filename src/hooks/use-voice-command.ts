'use client';

/**
 * Voice Command Hook
 * 
 * Uses Web Speech API for voice recognition.
 * Listens for wake phrases like "What is this?", "Explain this", etc.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceCommandState {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string | null;
  lastTranscript: string | null;
  error: string | null;
}

export interface UseVoiceCommandReturn extends VoiceCommandState {
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

// Wake phrases that trigger AI explanation
const WAKE_PHRASES = [
  'what is this',
  'explain this',
  'tell me about this',
  'what\'s this',
  'describe this',
  'help me understand',
  'what does this mean',
  'what am i looking at',
];

// Check if a transcript contains a wake phrase
function detectWakePhrase(transcript: string): string | null {
  const normalized = transcript.toLowerCase().trim();
  
  for (const phrase of WAKE_PHRASES) {
    if (normalized.includes(phrase)) {
      return phrase;
    }
  }
  
  // Also check for questions about specific things
  if (normalized.includes('what is') || 
      normalized.includes('what\'s') ||
      normalized.includes('explain') ||
      normalized.includes('tell me about')) {
    return normalized;
  }
  
  return null;
}

// Web Speech API types (not in all TypeScript libs)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// Check if Web Speech API is supported
function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!(
    (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition || 
    (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition
  );
}

// Get SpeechRecognition constructor
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  
  const win = window as Window & { 
    SpeechRecognition?: SpeechRecognitionConstructor; 
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export interface VoiceCommandOptions {
  continuous?: boolean;       // Keep listening after each result
  interimResults?: boolean;   // Show interim results
  language?: string;          // Recognition language
  onCommand?: (command: string, transcript: string) => void;
}

export function useVoiceCommand(options: VoiceCommandOptions = {}): UseVoiceCommandReturn {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onCommand,
  } = options;
  
  const [state, setState] = useState<VoiceCommandState>({
    isListening: false,
    isSupported: false,
    lastCommand: null,
    lastTranscript: null,
    error: null,
  });
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onCommandRef = useRef(onCommand);
  
  // Update callback ref
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);
  
  // Initialize speech recognition
  useEffect(() => {
    const supported = isWebSpeechSupported();
    setState(prev => ({ ...prev, isSupported: supported }));
    
    if (!supported) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }
    
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) return;
    
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    
    recognition.onstart = () => {
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null 
      }));
    };
    
    recognition.onend = () => {
      setState(prev => ({ 
        ...prev, 
        isListening: false 
      }));
      
      // Auto-restart if continuous mode
      if (continuous && recognitionRef.current) {
        try {
          // Small delay before restart to prevent rapid firing
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch {
          // Ignore restart errors
        }
      }
    };
    
    recognition.onerror = (event) => {
      // Ignore no-speech and aborted errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        error: `Speech recognition error: ${event.error}`,
        isListening: false,
      }));
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      const transcript = finalTranscript || interimTranscript;
      
      if (transcript) {
        setState(prev => ({ 
          ...prev, 
          lastTranscript: transcript 
        }));
        
        // Check for wake phrase
        const command = detectWakePhrase(transcript);
        if (command && finalTranscript) {
          setState(prev => ({ 
            ...prev, 
            lastCommand: command 
          }));
          
          // Trigger callback
          if (onCommandRef.current) {
            onCommandRef.current(command, finalTranscript);
          }
        }
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [continuous, interimResults, language]);
  
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not initialized' 
      }));
      return;
    }
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      // Already started, ignore
      if ((error as Error).message?.includes('already started')) {
        return;
      }
      setState(prev => ({ 
        ...prev, 
        error: `Failed to start: ${(error as Error).message}` 
      }));
    }
  }, []);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState(prev => ({ ...prev, isListening: false }));
  }, []);
  
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);
  
  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
  };
}

export default useVoiceCommand;

