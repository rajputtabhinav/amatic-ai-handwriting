/**
 * Voice Synchronization System
 * 
 * Synchronizes AI voice narration with visual step animations.
 * Coordinates timing between Framer Motion and ElevenLabs voice.
 */

export interface VoiceSyncConfig {
  step: number;
  narration: string;
  visualTrigger: 'before' | 'during' | 'after';
  voiceSpeed?: number;
  pauseBefore?: number; // ms to pause before narration
  pauseAfter?: number; // ms to pause after narration
}

export interface VoiceProvider {
  speak(text: string, options?: { speed?: number; pitch?: number }): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
}

/**
 * Voice Tutor Synchronization Manager
 */
export class VoiceTutorSync {
  private voiceProvider: VoiceProvider;
  private onVisualTrigger: (step: number) => Promise<void>;
  private currentlySpeaking: boolean = false;

  constructor(
    voiceProvider: VoiceProvider,
    onVisualTrigger: (step: number) => Promise<void>
  ) {
    this.voiceProvider = voiceProvider;
    this.onVisualTrigger = onVisualTrigger;
  }

  /**
   * Narrate a step with synchronized visuals
   */
  async narrateStep(config: VoiceSyncConfig): Promise<void> {
    try {
      this.currentlySpeaking = true;

      // Pause before if configured
      if (config.pauseBefore) {
        await this.sleep(config.pauseBefore);
      }

      // Execute based on trigger timing
      switch (config.visualTrigger) {
        case 'before':
          // Trigger visual first, then speak
          await this.onVisualTrigger(config.step);
          await this.sleep(300); // Small delay for visual to settle
          await this.speakText(config.narration, config.voiceSpeed);
          break;

        case 'during':
          // Trigger visual and speak simultaneously
          await Promise.all([
            this.onVisualTrigger(config.step),
            this.speakText(config.narration, config.voiceSpeed),
          ]);
          break;

        case 'after':
          // Speak first, then trigger visual
          await this.speakText(config.narration, config.voiceSpeed);
          await this.sleep(200);
          await this.onVisualTrigger(config.step);
          break;
      }

      // Pause after if configured
      if (config.pauseAfter) {
        await this.sleep(config.pauseAfter);
      }
    } finally {
      this.currentlySpeaking = false;
    }
  }

  /**
   * Narrate multiple steps in sequence
   */
  async narrateSequence(configs: VoiceSyncConfig[]): Promise<void> {
    for (const config of configs) {
      await this.narrateStep(config);
    }
  }

  /**
   * Stop current narration
   */
  stop(): void {
    this.voiceProvider.stop();
    this.currentlySpeaking = false;
  }

  /**
   * Check if currently narrating
   */
  isNarrating(): boolean {
    return this.currentlySpeaking || this.voiceProvider.isSpeaking();
  }

  /**
   * Speak text with optional speed adjustment
   */
  private async speakText(text: string, speed?: number): Promise<void> {
    await this.voiceProvider.speak(text, { speed });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create voice sync instance with ElevenLabs provider
 */
export async function createVoiceTutorSync(
  onVisualTrigger: (step: number) => Promise<void>
): Promise<VoiceTutorSync> {
  // Create voice provider that uses existing ElevenLabs service
  const voiceProvider: VoiceProvider = {
    async speak(text: string, options?: { speed?: number }) {
      try {
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceId: 'JBFqnCBsd6RMkjVDRZzb', // Rachel - professional
            speed: options?.speed || 1.0,
          }),
        });

        const data = await response.json();

        if (data.success && data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          await audio.play();
          
          // Wait for audio to finish
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error('Audio playback failed'));
          });
        } else if ('speechSynthesis' in window) {
          // Fallback to browser TTS
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = options?.speed || 1.0;
          
          await new Promise<void>((resolve) => {
            utterance.onend = () => resolve();
            window.speechSynthesis.speak(utterance);
          });
        }
      } catch (error) {
        console.error('Voice synthesis error:', error);
        // Silent fail - don't block visual progression
      }
    },

    stop() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },

    isSpeaking() {
      if ('speechSynthesis' in window) {
        return window.speechSynthesis.speaking;
      }
      return false;
    },
  };

  return new VoiceTutorSync(voiceProvider, onVisualTrigger);
}

/**
 * Generate narration timeline from component steps
 */
export function generateNarrationTimeline(
  steps: Array<{ title: string; explanation: string }>,
  visualTiming: 'before' | 'during' | 'after' = 'during'
): VoiceSyncConfig[] {
  return steps.map((step, index) => ({
    step: index,
    narration: step.explanation,
    visualTrigger: visualTiming,
    pauseBefore: index === 0 ? 500 : 200, // Longer pause for first step
    pauseAfter: 300,
  }));
}

export default {
  VoiceTutorSync,
  createVoiceTutorSync,
  generateNarrationTimeline,
};

