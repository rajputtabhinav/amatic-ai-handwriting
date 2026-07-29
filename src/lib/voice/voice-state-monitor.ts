/**
 * Voice State Monitor
 * 
 * Tracks voice playback state for precise synchronization.
 * Monitors current position, word being spoken, and playback status.
 */

import type { WordTimestamp } from '@/types/master-plan';

export interface VoicePlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentWord: string | null;
  progress: number;  // 0-1
}

export type PlaybackCallback = (state: VoicePlaybackState) => void;

/**
 * Voice State Monitor
 */
export class VoiceStateMonitor {
  private audioElement: HTMLAudioElement | null = null;
  private wordTimestamps: WordTimestamp[] = [];
  private callbacks: PlaybackCallback[] = [];
  private updateInterval: number | null = null;
  
  /**
   * Initialize with audio element and word timestamps
   */
  initialize(audioUrl: string, wordTimestamps: WordTimestamp[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audioElement = new Audio(audioUrl);
      this.wordTimestamps = wordTimestamps;
      
      this.audioElement.addEventListener('canplaythrough', () => {
        this.setupEventListeners();
        resolve();
      }, { once: true });
      
      this.audioElement.addEventListener('error', (e) => {
        reject(new Error(`Audio load failed: ${e}`));
      }, { once: true });
      
      this.audioElement.load();
    });
  }
  
  /**
   * Set up audio event listeners
   */
  private setupEventListeners(): void {
    if (!this.audioElement) return;
    
    this.audioElement.addEventListener('play', () => {
      this.startUpdateLoop();
    });
    
    this.audioElement.addEventListener('pause', () => {
      this.stopUpdateLoop();
      this.notifyCallbacks();
    });
    
    this.audioElement.addEventListener('ended', () => {
      this.stopUpdateLoop();
      this.notifyCallbacks();
    });
  }
  
  /**
   * Register playback state callback
   */
  onStateChange(callback: PlaybackCallback): void {
    this.callbacks.push(callback);
  }
  
  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (this.audioElement) {
      await this.audioElement.play();
    }
  }
  
  /**
   * Pause audio
   */
  pause(): void {
    this.audioElement?.pause();
  }
  
  /**
   * Resume audio
   */
  resume(): void {
    this.audioElement?.play();
  }
  
  /**
   * Stop and reset
   */
  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.stopUpdateLoop();
  }
  
  /**
   * Seek to time
   */
  seek(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
      this.notifyCallbacks();
    }
  }
  
  /**
   * Get current playback state
   */
  getState(): VoicePlaybackState {
    if (!this.audioElement) {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        currentWord: null,
        progress: 0
      };
    }
    
    const currentTime = this.audioElement.currentTime;
    const duration = this.audioElement.duration || 0;
    const currentWord = this.getCurrentWord(currentTime);
    
    return {
      isPlaying: !this.audioElement.paused,
      currentTime,
      duration,
      currentWord,
      progress: duration > 0 ? currentTime / duration : 0
    };
  }
  
  /**
   * Get word being spoken at current time
   */
  private getCurrentWord(time: number): string | null {
    for (const wt of this.wordTimestamps) {
      if (time >= wt.start && time < wt.end) {
        return wt.word;
      }
    }
    return null;
  }
  
  /**
   * Start update loop
   */
  private startUpdateLoop(): void {
    if (this.updateInterval) return;
    
    const update = () => {
      this.notifyCallbacks();
      if (this.audioElement && !this.audioElement.paused) {
        this.updateInterval = requestAnimationFrame(update) as unknown as number;
      }
    };
    
    this.updateInterval = requestAnimationFrame(update) as unknown as number;
  }
  
  /**
   * Stop update loop
   */
  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      cancelAnimationFrame(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    const state = this.getState();
    for (const callback of this.callbacks) {
      callback(state);
    }
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.stopUpdateLoop();
    
    if (this.audioElement) {
      this.audioElement.src = '';
      this.audioElement = null;
    }
    
    this.wordTimestamps = [];
    this.callbacks = [];
  }
}

/**
 * Create voice state monitor
 */
export function createVoiceStateMonitor(): VoiceStateMonitor {
  return new VoiceStateMonitor();
}

export default {
  VoiceStateMonitor,
  createVoiceStateMonitor
};

