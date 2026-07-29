/**
 * OpenAI Voice Service Loader
 * Uses OpenAI Whisper for STT and OpenAI TTS for speech output
 * NO ElevenLabs - pure OpenAI implementation
 */

import { logger } from '@/lib/logger';

export interface VoiceOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
}

export interface VoiceService {
  isReady(): Promise<boolean>;
  textToSpeech(text: string, voiceId?: string, options?: VoiceOptions): Promise<ReadableStream<Uint8Array> | null>;
  speechToText(audioBlob: Blob): Promise<string | null>;
  testVoice(voiceId: string, text?: string): Promise<ReadableStream<Uint8Array> | null>;
}

export async function loadVoiceService(): Promise<VoiceService> {
  // Server-side: return mock
  if (typeof window === 'undefined') {
    return {
      isReady: async () => false,
      textToSpeech: async () => null,
      speechToText: async () => null,
      testVoice: async () => null,
    };
  }

  // CLIENT-SIDE: Use OpenAI API routes (Whisper STT + OpenAI TTS)
  return {
    /**
     * Check if OpenAI API is available
     */
    isReady: async () => {
      try {
        const response = await fetch('/api/voice/whisper-tts');
        return response.ok;
      } catch {
        return false;
      }
    },
    
    /**
     * Text-to-Speech using OpenAI TTS
     */
    textToSpeech: async (text: string, voiceId?: string, options?: VoiceOptions) => {
      try {
        const response = await fetch('/api/voice/whisper-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text, 
            voice: options?.voice || voiceId || 'nova',
            speed: options?.speed || 1.0
          })
        });
        
        if (!response.ok) {
          logger.error('TTS API error', { status: response.status });
          return null;
        }
        
        return response.body;
      } catch (error) {
        logger.error('Text-to-speech failed', error);
        return null;
      }
    },
    
    /**
     * Speech-to-Text using OpenAI Whisper
     */
    speechToText: async (audioBlob: Blob) => {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        const response = await fetch('/api/voice/whisper-transcribe', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          logger.error('STT API error', { status: response.status });
          return null;
        }
        
        const data = await response.json();
        return data.text || null;
      } catch (error) {
        logger.error('Speech-to-text failed', error);
        return null;
      }
    },
    
    /**
     * Test voice output
     */
    testVoice: async (voiceId: string, text: string = 'Hello, this is a test.') => {
      return loadVoiceService().then((service) => service.textToSpeech(text, voiceId));
    }
  };
}
