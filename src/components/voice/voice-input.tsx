'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
// No direct import - will load voice service dynamically when needed

// Speech Recognition types for browser API
interface VoiceSpeechRecognitionEvent {
  results: VoiceSpeechRecognitionResultList;
}

interface VoiceSpeechRecognitionResultList {
  readonly length: number;
  [index: number]: VoiceSpeechRecognitionResult;
}

interface VoiceSpeechRecognitionResult {
  readonly length: number;
  [index: number]: VoiceSpeechRecognitionAlternative;
}

interface VoiceSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface VoiceSpeechRecognitionError {
  error: string;
}

interface VoiceSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: VoiceSpeechRecognitionEvent) => void) | null;
  onerror: ((event: VoiceSpeechRecognitionError) => void) | null;
  start: () => void;
}

interface VoiceInputWindow extends Window {
  SpeechRecognition?: new () => VoiceSpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => VoiceSpeechRecognitionInstance;
}

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  isDisabled?: boolean;
  className?: string;
  // autoSubmit?: boolean; // Removed as it's handled internally
}

export default function VoiceInput({
  onTranscription,
  onError,
  isDisabled = false,
  className,
  // autoSubmit = false
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Request microphone permission
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      streamRef.current = stream;
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      onError?.('Microphone access denied. Please enable microphone permission.');
      return false;
    }
  };

  // Setup audio level monitoring
  const setupAudioMonitoring = () => {
    if (!streamRef.current) return;

    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 100));
        
        if (isRecording) {
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (isDisabled) return;

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      audioChunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current!);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        await processRecording();
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      setupAudioMonitoring();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.('Failed to start recording. Please try again.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setAudioLevel(0);
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Process recording and convert to text
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      try {
        // Dynamically load voice service
        const { loadVoiceService } = await import('@/lib/voice/voice-service-loader');
        const voiceService = await loadVoiceService();
        
        const isServiceReady = await voiceService.isReady();
        if (isServiceReady) {
          const transcription = await voiceService.speechToText(audioBlob);
          
          if (transcription && transcription.trim()) {
            onTranscription(transcription.trim());
          } else {
            onError?.('No speech detected. Please try again.');
          }
        } else {
          // Fallback to Web Speech API
          await fallbackSpeechToText();
        }
      } catch (voiceError) {
        console.warn('Voice service failed, using fallback:', voiceError);
        // Fallback to Web Speech API
        await fallbackSpeechToText();
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      onError?.('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  // Fallback Web Speech API
  const fallbackSpeechToText = async () => {
    const win = window as VoiceInputWindow;
    if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
      onError?.('Speech recognition not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        onError?.('Speech recognition not available.');
        return;
      }
      const recognition = new SpeechRecognitionClass();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: VoiceSpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          onTranscription(transcript.trim());
        }
      };
      
      recognition.onerror = (event: VoiceSpeechRecognitionError) => {
        onError?.(`Speech recognition error: ${event.error}`);
      };
      
      recognition.start();
    } catch (error: unknown) {
      console.error('Speech recognition error:', error);
      onError?.('Speech recognition failed. Please try again.');
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle click
  const handleClick = () => {
    if (isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (isRecording) {
        stopRecording();
      }
      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Cancel animation frames
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Stop media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      
      // Clear analyser
      if (analyserRef.current) {
        analyserRef.current = null;
      }
    };
  }, [isRecording]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Main recording button */}
      <div className="relative">
        <Button
          onClick={handleClick}
          disabled={isDisabled || isProcessing}
          variant={isRecording ? "destructive" : "outline"}
          size="lg"
          className={cn(
            "w-16 h-16 rounded-full transition-all duration-300",
            isRecording && "animate-pulse",
            isProcessing && "opacity-50 cursor-wait"
          )}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <Square className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
        
        {/* Audio level indicator */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-red-500 opacity-30">
            <div 
              className="absolute inset-0 rounded-full bg-red-500 opacity-20 transition-transform duration-100"
              style={{ 
                transform: `scale(${1 + (audioLevel / 100) * 0.5})` 
              }}
            />
          </div>
        )}
      </div>

      {/* Recording controls */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <Button
            onClick={togglePause}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button
            onClick={stopRecording}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <MicOff className="w-3 h-3" />
            Stop
          </Button>
        </div>
      )}

      {/* Status display */}
      <div className="text-center">
        {isProcessing ? (
          <p className="text-sm text-muted-foreground">Processing audio...</p>
        ) : isRecording ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-600">
              {isPaused ? 'Paused' : 'Recording'} • {formatTime(recordingTime)}
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="h-1 w-8 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-100 rounded-full"
                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{Math.round(audioLevel)}%</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click to start voice input
          </p>
        )}
      </div>
    </div>
  );
}
