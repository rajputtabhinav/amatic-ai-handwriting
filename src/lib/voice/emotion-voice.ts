/**
 * Emotion Voice Service
 * 
 * DEPRECATED: This file is being migrated to use OpenAI TTS instead.
 * Currently provides stub implementations for backward compatibility.
 * TODO: Refactor voice-sync.ts and orchestrate/route.ts to use OpenAI TTS directly.
 */

// Stub voice IDs for backward compatibility
const TEACHER_VOICES = {
  rachel: { id: 'nova', name: 'Nova (Teacher)', description: 'Professional OpenAI voice' },
  adam: { id: 'onyx', name: 'Onyx (Professor)', description: 'Deep OpenAI voice' },
  bella: { id: 'shimmer', name: 'Shimmer (Friendly)', description: 'Warm OpenAI voice' },
  josh: { id: 'echo', name: 'Echo (Young Teacher)', description: 'Energetic OpenAI voice' }
};

export interface EmotionVoiceConfig {
  emotion: VoiceEmotion;
  audience: 'kid' | 'teen' | 'adult' | 'professional';
  speed?: number;
  pitch?: number;
}

export type VoiceEmotion = 
  | 'friendly'
  | 'enthusiastic'
  | 'calm'
  | 'professional'
  | 'encouraging'
  | 'curious'
  | 'serious'
  | 'warm';

export interface VoiceSegment {
  text: string;
  startTime: number;
  endTime: number;
  emotion?: VoiceEmotion;
}

export interface GeneratedVoice {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  segments: VoiceSegment[];
}

/**
 * Voice presets for different emotions
 */
const EMOTION_PRESETS: Record<VoiceEmotion, {
  stability: number;
  similarityBoost: number;
  style: number;
  voiceId: string;
}> = {
  friendly: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.6,
    voiceId: TEACHER_VOICES.bella.id
  },
  enthusiastic: {
    stability: 0.4,
    similarityBoost: 0.7,
    style: 0.8,
    voiceId: TEACHER_VOICES.josh.id
  },
  calm: {
    stability: 0.7,
    similarityBoost: 0.8,
    style: 0.3,
    voiceId: TEACHER_VOICES.rachel.id
  },
  professional: {
    stability: 0.6,
    similarityBoost: 0.75,
    style: 0.4,
    voiceId: TEACHER_VOICES.adam.id
  },
  encouraging: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.7,
    voiceId: TEACHER_VOICES.bella.id
  },
  curious: {
    stability: 0.45,
    similarityBoost: 0.7,
    style: 0.6,
    voiceId: TEACHER_VOICES.josh.id
  },
  serious: {
    stability: 0.65,
    similarityBoost: 0.8,
    style: 0.2,
    voiceId: TEACHER_VOICES.adam.id
  },
  warm: {
    stability: 0.55,
    similarityBoost: 0.75,
    style: 0.5,
    voiceId: TEACHER_VOICES.rachel.id
  }
};

/**
 * Audience-based voice selection
 */
const AUDIENCE_VOICES: Record<string, string> = {
  kid: TEACHER_VOICES.bella.id,
  teen: TEACHER_VOICES.josh.id,
  adult: TEACHER_VOICES.rachel.id,
  professional: TEACHER_VOICES.adam.id
};

/**
 * Emotion Voice Service (STUB - uses OpenAI TTS)
 */
export class EmotionVoiceService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Check if service is available
   */
  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate emotional voice for text (STUB - uses OpenAI TTS)
   */
  async generateVoice(
    text: string,
    config: EmotionVoiceConfig
  ): Promise<GeneratedVoice> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Map emotion to OpenAI voice
    const voiceMap: Record<VoiceEmotion, string> = {
      friendly: 'shimmer',
      enthusiastic: 'echo',
      calm: 'nova',
      professional: 'onyx',
      encouraging: 'shimmer',
      curious: 'echo',
      serious: 'onyx',
      warm: 'nova'
    };

    const voice = voiceMap[config.emotion] || 'nova';

    // Call OpenAI TTS API
    const response = await fetch('/api/voice/whisper-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed: 1.0 })
    });

    if (!response.ok) {
      throw new Error('Failed to generate voice');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Estimate duration (rough approximation)
    const wordCount = text.split(/\s+/).length;
    const duration = wordCount / 2.5; // ~2.5 words per second

    return {
      audioBlob,
      audioUrl,
      duration,
      segments: [{
        text,
        startTime: 0,
        endTime: duration,
        emotion: config.emotion
      }]
    };
  }

  /**
   * Generate voice with word-level timestamps
   * Enhanced for precise highlighting synchronization
   */
  async generateVoiceWithTimestamps(
    text: string,
    config: EmotionVoiceConfig
  ): Promise<{
    audioBlob: Blob;
    audioUrl: string;
    duration: number;
    wordTimestamps: Array<{ word: string; start: number; end: number }>;
  }> {
    // Generate base voice
    const voice = await this.generateVoice(text, config);
    
    // Generate word-level timestamps (estimated based on word count)
    const words = text.split(/\s+/);
    const wordTimestamps: Array<{ word: string; start: number; end: number }> = [];
    const avgWordDuration = voice.duration / words.length;
    
    let currentTime = 0;
    for (const word of words) {
      // Adjust duration based on word length (longer words take more time)
      const wordDuration = (word.length / 6) * avgWordDuration;
      
      wordTimestamps.push({
        word,
        start: currentTime,
        end: currentTime + wordDuration
      });
      
      currentTime += wordDuration;
    }
    
    return {
      audioBlob: voice.audioBlob,
      audioUrl: voice.audioUrl,
      duration: voice.duration,
      wordTimestamps
    };
  }

  /**
   * Generate voice for timeline scenes (STUB - uses OpenAI TTS)
   */
  async generateTimelineVoice(
    scenes: Array<{ time: number; voice: string }>,
    config: EmotionVoiceConfig
  ): Promise<{
    audioBlob: Blob;
    audioUrl: string;
    totalDuration: number;
    segments: VoiceSegment[];
  }> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Combine all voice text with pauses
    const combinedText = scenes.map(s => s.voice).join('. ');
    
    // Generate single audio
    const voice = await this.generateVoice(combinedText, config);
    
    // Calculate segment timings
    const segments: VoiceSegment[] = [];
    let currentTime = 0;
    
    for (const scene of scenes) {
      const wordCount = scene.voice.split(/\s+/).length;
      const segmentDuration = wordCount / 2.5;
      
      segments.push({
        text: scene.voice,
        startTime: currentTime,
        endTime: currentTime + segmentDuration,
        emotion: config.emotion
      });
      
      currentTime += segmentDuration + 0.5; // 0.5s pause between segments
    }

    return {
      audioBlob: voice.audioBlob,
      audioUrl: voice.audioUrl,
      totalDuration: currentTime,
      segments
    };
  }

  /**
   * Stream voice generation for real-time playback (STUB - not implemented for OpenAI)
   */
  async *streamVoice(
    text: string,
    config: EmotionVoiceConfig
  ): AsyncGenerator<Uint8Array> {
    // OpenAI TTS doesn't support streaming in the same way
    // Generate full audio and yield as single chunk
    const voice = await this.generateVoice(text, config);
    const arrayBuffer = await voice.audioBlob.arrayBuffer();
    yield new Uint8Array(arrayBuffer);
  }

  /**
   * Get recommended voice settings from query analysis
   */
  static getVoiceConfigFromAnalysis(analysis: {
    audience: string;
    emotion: string;
    voiceTone: string;
  }): EmotionVoiceConfig {
    // Map analysis to voice emotion
    let emotion: VoiceEmotion = 'professional';
    
    switch (analysis.voiceTone) {
      case 'warm':
        emotion = 'warm';
        break;
      case 'casual':
        emotion = 'friendly';
        break;
      case 'enthusiastic':
        emotion = 'enthusiastic';
        break;
      case 'professional':
        emotion = 'professional';
        break;
    }

    // Adjust based on detected emotion
    switch (analysis.emotion) {
      case 'curious':
        emotion = 'curious';
        break;
      case 'confused':
        emotion = 'encouraging';
        break;
      case 'excited':
        emotion = 'enthusiastic';
        break;
      case 'serious':
        emotion = 'serious';
        break;
    }

    return {
      emotion,
      audience: analysis.audience as EmotionVoiceConfig['audience']
    };
  }

  /**
   * Cleanup audio URL
   */
  static revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

/**
 * Create emotion voice service
 */
export function createEmotionVoiceService(apiKey?: string): EmotionVoiceService {
  return new EmotionVoiceService(apiKey);
}

/**
 * Singleton instance
 */
let globalService: EmotionVoiceService | null = null;

export function getEmotionVoiceService(): EmotionVoiceService {
  if (!globalService) {
    globalService = new EmotionVoiceService();
  }
  return globalService;
}

// Default export
export default {
  EmotionVoiceService,
  createEmotionVoiceService,
  getEmotionVoiceService,
  EMOTION_PRESETS,
  AUDIENCE_VOICES
};

