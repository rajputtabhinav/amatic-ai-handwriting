'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react';
import { cn } from '@/lib/utils';
// No direct import - will load voice service dynamically when needed

interface VoiceOutputProps {
  text: string;
  voiceId?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function VoiceOutput({
  text,
  voiceId,
  autoPlay = false,
  showControls = true,
  onPlayStart,
  onPlayEnd,
  onError,
  className
}: VoiceOutputProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  // const timeUpdateRef = useRef<NodeJS.Timeout | null>(null); // Removed - not used

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    // Create stable event handler references
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => {
      setIsPlaying(true);
      setIsPaused(false);
      onPlayStart?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
      onPlayEnd?.();
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      onError?.('Failed to play audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    // Audio event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);

    // Set initial volume
    audio.volume = volume;

    // Cleanup function with proper event listener removal
    const cleanup = () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      
      audio.pause();
      audio.src = '';
      
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };

    return cleanup;
  }, [onError, onPlayStart, onPlayEnd, volume]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle playback rate changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Convert text to speech and play
  const playAudio = useCallback(async () => {
    if (!text.trim()) {
      onError?.('No text to convert to speech');
      return;
    }

    setIsLoading(true);

    try {
      // Dynamically load voice service
      const { loadVoiceService } = await import('@/lib/voice/voice-service-loader');
      const voiceService = await loadVoiceService();
      
      const isServiceReady = await voiceService.isReady();
      if (!isServiceReady) {
        onError?.('Voice service not available');
        setIsLoading(false);
        return;
      }

      // Get audio stream from OpenAI TTS
      const audioStream = await voiceService.textToSpeech(text, voiceId, {
        voice: 'nova', // OpenAI TTS voice
        speed: 1.0
      });

      if (!audioStream) {
        onError?.('Failed to generate speech');
        return;
      }

      // Convert stream to blob
      const chunks: Uint8Array[] = [];
      const reader = audioStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const audioBlob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
      
      // Clean up previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      // Create new URL and set as audio source
      audioUrlRef.current = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrlRef.current;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      onError?.('Failed to play audio');
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [text, voiceId, onError]);

  // Auto-play when text changes
  useEffect(() => {
    if (autoPlay && text.trim()) {
      playAudio();
    }
  }, [text, voiceId, autoPlay, playAudio]);

  // Pause audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Resume audio
  const resumeAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Error resuming audio:', error);
        onError?.('Failed to resume audio');
      });
    }
  };

  // Stop audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // Seek to position
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      seekTo(newTime);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause button click
  const handlePlayPause = () => {
    if (isLoading) return;

    if (isPlaying) {
      pauseAudio();
    } else if (isPaused) {
      resumeAudio();
    } else {
      playAudio();
    }
  };

  return (
    <div className={cn("voice-output-container", className)}>
      {showControls && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          {/* Main controls */}
          <div className="flex items-center gap-3">
            {/* Skip backward */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipTime(-10)}
              disabled={!duration || isLoading}
              className="h-8 w-8 p-0"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              onClick={handlePlayPause}
              disabled={isLoading || !text.trim()}
              variant="default"
              size="sm"
              className="h-10 w-10 p-0 rounded-full"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            {/* Skip forward */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipTime(10)}
              disabled={!duration || isLoading}
              className="h-8 w-8 p-0"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Stop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={stopAudio}
              disabled={!isPlaying && !isPaused}
              className="h-8 w-8 p-0"
            >
              <Square className="h-4 w-4" />
            </Button>

            {/* Volume control */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 p-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={([value]) => {
                    const newVolume = value / 100;
                    setVolume(newVolume);
                    if (newVolume > 0) setIsMuted(false);
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {duration > 0 && (
            <div className="space-y-2">
              <div className="w-full">
                <Slider
                  value={[currentTime]}
                  onValueChange={([value]) => seekTo(value)}
                  max={duration}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Playback speed */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-background border rounded px-2 py-1 text-xs"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>
      )}

      {/* Simple play button when controls are hidden */}
      {!showControls && (
        <Button
          onClick={handlePlayPause}
          disabled={isLoading || !text.trim()}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Status indicator */}
      {isLoading && (
        <div className="text-xs text-muted-foreground text-center">
          Generating speech...
        </div>
      )}
    </div>
  );
}
