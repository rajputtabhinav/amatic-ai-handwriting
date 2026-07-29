// Mock voice service for server-side rendering and fallback

interface VoiceOptions {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface MockVoiceService {
  isReady(): Promise<boolean>;
  textToSpeech(text: string, voiceId?: string, options?: VoiceOptions): Promise<ReadableStream<Uint8Array> | null>;
  speechToText(audioBlob: Blob): Promise<string | null>;
  testVoice(voiceId: string, text?: string): Promise<ReadableStream<Uint8Array> | null>;
}

export const mockVoiceService: MockVoiceService = {
  isReady: async () => false,
  textToSpeech: async () => null,
  speechToText: async () => null,
  testVoice: async () => null,
};

// Web Speech API types
interface MockSpeechRecognitionEvent {
  results: MockSpeechRecognitionResultList;
}

interface MockSpeechRecognitionResultList {
  readonly length: number;
  [index: number]: MockSpeechRecognitionResult;
}

interface MockSpeechRecognitionResult {
  readonly length: number;
  [index: number]: MockSpeechRecognitionAlternative;
}

interface MockSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface MockSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: MockSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
}

// Window with speech recognition
interface MockWindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => MockSpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => MockSpeechRecognitionInstance;
}

// Web Speech API fallback for speech-to-text
export function useWebSpeechAPI(): Promise<string | null> {
  return new Promise((resolve) => {
    const win = window as MockWindowWithSpeechRecognition;
    
    if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
      resolve(null);
      return;
    }

    try {
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        resolve(null);
        return;
      }
      
      const recognition = new SpeechRecognitionClass();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: MockSpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript || null);
      };
      
      recognition.onerror = () => {
        resolve(null);
      };
      
      recognition.start();
    } catch {
      resolve(null);
    }
  });
}
