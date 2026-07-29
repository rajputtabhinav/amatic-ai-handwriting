'use client';

/**
 * Scene Player Component
 * 
 * Synchronized visual + audio playback.
 * Plays animated SVG with voice narration.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhysicsCanvas } from './physics-canvas';
import { VoiceSyncManager, createVoiceSyncManager } from '@/lib/voice/voice-sync';
import { AnimationTimeline, TimelineScene, SVGElementData, PhysicsProperties } from '@/lib/api/anthropic-client';
import { EmotionVoiceConfig, getEmotionVoiceService } from '@/lib/voice/emotion-voice';

export interface ScenePlayerProps {
  svgCode: string;
  elements: SVGElementData[];
  physics: PhysicsProperties;
  timeline: AnimationTimeline;
  voiceConfig?: EmotionVoiceConfig;
  topic?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  showSubtitles?: boolean;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

interface PlayerState {
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentScene: TimelineScene | null;
  currentSceneIndex: number;
  currentSubtitle: string;
  error: string | null;
}

export function ScenePlayer({
  svgCode,
  elements,
  physics,
  timeline,
  voiceConfig = { emotion: 'professional', audience: 'adult' },
  topic = 'general',
  autoPlay = false,
  showControls = true,
  showSubtitles = true,
  onComplete,
  onError,
  className = ''
}: ScenePlayerProps) {
  const syncManagerRef = useRef<VoiceSyncManager | null>(null);
  const [state, setState] = useState<PlayerState>({
    isLoading: true,
    isPlaying: false,
    currentTime: 0,
    duration: timeline.duration,
    currentScene: null,
    currentSceneIndex: -1,
    currentSubtitle: '',
    error: null
  });

  // Initialize voice sync
  useEffect(() => {
    const init = async () => {
      try {
        syncManagerRef.current = createVoiceSyncManager();
        
        // Set up callbacks
        syncManagerRef.current.setCallbacks({
          onSceneChange: (scene, index) => {
            setState(prev => ({
              ...prev,
              currentScene: scene,
              currentSceneIndex: index,
              currentSubtitle: scene.voice
            }));
          },
          onProgress: (currentTime, duration) => {
            setState(prev => ({
              ...prev,
              currentTime,
              duration: duration || prev.duration
            }));
          },
          onComplete: () => {
            setState(prev => ({
              ...prev,
              isPlaying: false,
              currentSceneIndex: -1
            }));
            onComplete?.();
          },
          onError: (error) => {
            setState(prev => ({ ...prev, error: error.message }));
            onError?.(error);
          }
        });

        // Generate voice audio
        const voiceService = getEmotionVoiceService();
        
        if (voiceService.isAvailable) {
          const voiceResult = await voiceService.generateTimelineVoice(
            timeline.scenes.map(s => ({ time: s.time, voice: s.voice })),
            voiceConfig
          );
          
          // Load audio
          await syncManagerRef.current.load(
            voiceResult.audioUrl,
            timeline,
            voiceResult.segments
          );
        } else {
          // Load without audio
          await syncManagerRef.current.load(
            '',
            timeline,
            []
          );
        }

        setState(prev => ({ ...prev, isLoading: false }));

        // Auto play if requested
        if (autoPlay) {
          handlePlay();
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState(prev => ({ ...prev, isLoading: false, error: err.message }));
        onError?.(err);
      }
    };

    init();

    return () => {
      syncManagerRef.current?.destroy();
    };
  }, [timeline, voiceConfig, autoPlay]);

  // Play handler
  const handlePlay = useCallback(async () => {
    if (!syncManagerRef.current) return;
    
    try {
      setState(prev => ({ ...prev, isPlaying: true }));
      await syncManagerRef.current.play();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({ ...prev, isPlaying: false, error: err.message }));
    }
  }, []);

  // Pause handler
  const handlePause = useCallback(() => {
    syncManagerRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [state.isPlaying, handlePlay, handlePause]);

  // Seek handler
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    syncManagerRef.current?.seek(time);
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  // Restart handler
  const handleRestart = useCallback(() => {
    syncManagerRef.current?.stop();
    setState(prev => ({
      ...prev,
      currentTime: 0,
      currentSceneIndex: -1,
      currentSubtitle: ''
    }));
    handlePlay();
  }, [handlePlay]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className={`scene-player flex flex-col ${className}`}>
      {/* Canvas */}
      <div className="relative flex-1 min-h-0">
        <PhysicsCanvas
          svgCode={svgCode}
          elements={elements}
          physics={physics}
          topic={topic}
          isPlaying={state.isPlaying}
          className="w-full h-full"
        />
        
        {/* Subtitles */}
        {showSubtitles && state.currentSubtitle && (
          <div className="absolute bottom-16 left-0 right-0 px-4">
            <div className="bg-black/70 text-white text-center py-2 px-4 rounded-lg mx-auto max-w-lg">
              <p className="text-sm md:text-base">{state.currentSubtitle}</p>
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {state.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600">Preparing visual explanation...</p>
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {state.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm">
              <p className="text-red-600 text-sm">{state.error}</p>
              <button
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="bg-gray-900 text-white p-3 flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            disabled={state.isLoading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            {state.isPlaying ? (
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            disabled={state.isLoading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </button>

          {/* Time */}
          <span className="text-sm tabular-nums">
            {formatTime(state.currentTime)}
          </span>

          {/* Progress bar */}
          <div className="flex-1 relative h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={state.duration}
              step={0.1}
              value={state.currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Duration */}
          <span className="text-sm tabular-nums">
            {formatTime(state.duration)}
          </span>

          {/* Scene indicator */}
          <div className="text-xs text-white/60">
            {state.currentSceneIndex >= 0 && (
              <span>Scene {state.currentSceneIndex + 1}/{timeline.scenes.length}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal scene player without controls
 */
export function MiniScenePlayer({
  svgCode,
  elements,
  physics,
  timeline,
  topic = 'general',
  className = ''
}: {
  svgCode: string;
  elements: SVGElementData[];
  physics: PhysicsProperties;
  timeline: AnimationTimeline;
  topic?: string;
  className?: string;
}) {
  return (
    <ScenePlayer
      svgCode={svgCode}
      elements={elements}
      physics={physics}
      timeline={timeline}
      topic={topic}
      showControls={false}
      showSubtitles={true}
      autoPlay={true}
      className={className}
    />
  );
}

export default ScenePlayer;

