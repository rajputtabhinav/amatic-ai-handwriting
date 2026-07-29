/**
 * Voice Sync Service
 * 
 * Synchronizes voice playback with animation timeline.
 * Ensures voice narration matches visual animations perfectly.
 */

import { AnimationTimeline, TimelineScene } from '../api/anthropic-client';
import { EmotionVoiceService, VoiceSegment, EmotionVoiceConfig } from './emotion-voice';
// TODO: Re-enable when svg-animator is implemented
// import { SVGAnimator } from '../visual/svg-animator';

// Temporary type definition until SVGAnimator is re-implemented
type SVGAnimator = {
  start: () => void;
  stop: () => void;
  createFromAction: (element: string, action: string) => any;
  addAnimation: (animation: any) => void;
};

export interface SyncedPlayback {
  audioElement: HTMLAudioElement;
  timeline: AnimationTimeline;
  segments: VoiceSegment[];
  currentSceneIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface VoiceSyncCallbacks {
  onSceneChange?: (scene: TimelineScene, index: number) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Voice Sync Manager
 */
export class VoiceSyncManager {
  private audioElement: HTMLAudioElement | null = null;
  private timeline: AnimationTimeline | null = null;
  private segments: VoiceSegment[] = [];
  private animator: SVGAnimator | null = null;
  private callbacks: VoiceSyncCallbacks = {};
  
  private currentSceneIndex: number = -1;
  private isPlaying: boolean = false;
  private syncInterval: number | null = null;

  constructor() {
    // Create audio element for browser environments
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.setupAudioListeners();
    }
  }

  /**
   * Set up audio event listeners
   */
  private setupAudioListeners(): void {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.startSyncLoop();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.stopSyncLoop();
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.stopSyncLoop();
      this.callbacks.onComplete?.();
    });

    this.audioElement.addEventListener('error', (e) => {
      this.callbacks.onError?.(new Error(`Audio error: ${e}`));
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.updateSync();
    });
  }

  /**
   * Load audio and timeline for synchronized playback
   */
  async load(
    audioUrl: string,
    timeline: AnimationTimeline,
    segments: VoiceSegment[],
    animator?: SVGAnimator
  ): Promise<void> {
    if (!this.audioElement) {
      throw new Error('Audio not available in this environment');
    }

    this.timeline = timeline;
    this.segments = segments;
    this.animator = animator || null;
    this.currentSceneIndex = -1;

    return new Promise((resolve, reject) => {
      this.audioElement!.src = audioUrl;
      
      this.audioElement!.addEventListener('canplaythrough', () => {
        resolve();
      }, { once: true });

      this.audioElement!.addEventListener('error', (e) => {
        reject(new Error(`Failed to load audio: ${e}`));
      }, { once: true });

      this.audioElement!.load();
    });
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: VoiceSyncCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Attach animator for synchronized visual updates
   */
  attachAnimator(animator: SVGAnimator): void {
    this.animator = animator;
  }

  /**
   * Start synchronized playback
   */
  async play(): Promise<void> {
    if (!this.audioElement || !this.timeline) {
      throw new Error('Audio or timeline not loaded');
    }

    await this.audioElement.play();
    
    // Start animator if attached
    if (this.animator) {
      this.animator.start();
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.audioElement?.pause();
    this.animator?.stop();
  }

  /**
   * Resume playback
   */
  resume(): void {
    this.audioElement?.play();
    if (this.animator) {
      this.animator.start();
    }
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.animator?.stop();
    this.currentSceneIndex = -1;
    this.isPlaying = false;
    this.stopSyncLoop();
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
    this.updateSync();
  }

  /**
   * Start sync loop
   */
  private startSyncLoop(): void {
    if (this.syncInterval) return;
    
    const update = () => {
      this.updateSync();
      if (this.isPlaying) {
        this.syncInterval = requestAnimationFrame(update) as unknown as number;
      }
    };
    
    this.syncInterval = requestAnimationFrame(update) as unknown as number;
  }

  /**
   * Stop sync loop
   */
  private stopSyncLoop(): void {
    if (this.syncInterval) {
      cancelAnimationFrame(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Update sync state
   */
  private updateSync(): void {
    if (!this.audioElement || !this.timeline) return;

    const currentTime = this.audioElement.currentTime;
    const duration = this.audioElement.duration || this.timeline.duration;

    // Report progress
    this.callbacks.onProgress?.(currentTime, duration);

    // Find current scene
    const scenes = this.timeline.scenes;
    let newSceneIndex = -1;

    for (let i = scenes.length - 1; i >= 0; i--) {
      if (currentTime >= scenes[i].time) {
        newSceneIndex = i;
        break;
      }
    }

    // Scene change
    if (newSceneIndex !== this.currentSceneIndex && newSceneIndex >= 0) {
      this.currentSceneIndex = newSceneIndex;
      const scene = scenes[newSceneIndex];
      
      // Trigger animation
      if (this.animator) {
        const animation = this.animator.createFromAction(
          scene.svg_action.element,
          scene.svg_action.action
        );
        this.animator.addAnimation(animation);
      }

      // Callback
      this.callbacks.onSceneChange?.(scene, newSceneIndex);
    }
  }

  /**
   * Get current state
   */
  getState(): {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    currentSceneIndex: number;
    currentScene: TimelineScene | null;
  } {
    const currentTime = this.audioElement?.currentTime || 0;
    const duration = this.audioElement?.duration || this.timeline?.duration || 0;

    return {
      currentTime,
      duration,
      isPlaying: this.isPlaying,
      currentSceneIndex: this.currentSceneIndex,
      currentScene: this.timeline?.scenes[this.currentSceneIndex] || null
    };
  }

  /**
   * Get current segment
   */
  getCurrentSegment(): VoiceSegment | null {
    const currentTime = this.audioElement?.currentTime || 0;
    
    for (const segment of this.segments) {
      if (currentTime >= segment.startTime && currentTime < segment.endTime) {
        return segment;
      }
    }
    
    return null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    
    if (this.audioElement) {
      this.audioElement.src = '';
      this.audioElement = null;
    }
    
    this.timeline = null;
    this.segments = [];
    this.animator = null;
  }
}

/**
 * Generate synced audio for timeline
 */
export async function generateSyncedAudio(
  timeline: AnimationTimeline,
  voiceConfig: EmotionVoiceConfig,
  voiceService: EmotionVoiceService
): Promise<{
  audioUrl: string;
  segments: VoiceSegment[];
  totalDuration: number;
}> {
  const scenes = timeline.scenes.map(s => ({
    time: s.time,
    voice: s.voice
  }));

  const result = await voiceService.generateTimelineVoice(scenes, voiceConfig);
  
  return {
    audioUrl: result.audioUrl,
    segments: result.segments,
    totalDuration: result.totalDuration
  };
}

/**
 * Calculate segment timings from timeline
 */
export function calculateSegmentTimings(
  timeline: AnimationTimeline,
  wordsPerSecond: number = 2.5
): VoiceSegment[] {
  const segments: VoiceSegment[] = [];
  
  for (const scene of timeline.scenes) {
    const wordCount = scene.voice.split(/\s+/).length;
    const duration = wordCount / wordsPerSecond;
    
    segments.push({
      text: scene.voice,
      startTime: scene.time,
      endTime: scene.time + duration
    });
  }
  
  return segments;
}

/**
 * Create voice sync manager
 */
export function createVoiceSyncManager(): VoiceSyncManager {
  return new VoiceSyncManager();
}

// Default export
export default {
  VoiceSyncManager,
  createVoiceSyncManager,
  generateSyncedAudio,
  calculateSegmentTimings
};

