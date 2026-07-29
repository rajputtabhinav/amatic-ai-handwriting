"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

interface VoiceConversationProps {
  onTranscriptionComplete: (text: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  isAISpeaking: boolean;
}

export function VoiceConversation({
  onTranscriptionComplete,
  onVoiceStart,
  onVoiceEnd,
  isAISpeaking
}: VoiceConversationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false); // VAD listening mode
  const [transcription, setTranscription] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vadThreshold = 0.02; // Voice Activity Detection threshold
  const silenceDuration = 1500; // 1.5 seconds of silence to auto-stop

  // Start continuous listening with Voice Activity Detection
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for VAD and waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Start waveform and VAD monitoring
      updateWaveformWithVAD();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        }
        
        // Don't stop stream - keep listening
        audioChunksRef.current = [];
      };

      setIsListening(true);
      onVoiceStart?.();
    } catch (error) {
      console.error('Error starting listening:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop listening completely
  const stopListening = () => {
    if (mediaRecorderRef.current) {
      if (isRecording) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
    setIsListening(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    onVoiceEnd?.();
  };

  // Update waveform and detect voice activity (VAD)
  const updateWaveformWithVAD = () => {
    if (!analyserRef.current || !isListening) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalizedLevel = average / 255; // 0-1
    setAudioLevel(normalizedLevel);
    
    // Voice Activity Detection
    if (normalizedLevel > vadThreshold && !isRecording) {
      // Voice detected - start recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    } else if (normalizedLevel <= vadThreshold && isRecording) {
      // Silence detected - schedule auto-stop
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
          silenceTimeoutRef.current = null;
        }, silenceDuration);
      }
    } else if (normalizedLevel > vadThreshold && isRecording) {
      // Voice still active - cancel auto-stop
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(updateWaveformWithVAD);
  };

  // Transcribe audio using OpenAI Whisper
  const transcribeAudio = async (audioBlob: Blob) => {
    setTranscription('Transcribing...');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      setTranscription(data.text);
      
      // Notify parent component
      setTimeout(() => {
        onTranscriptionComplete(data.text);
        setTranscription('');
      }, 500);
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscription('Failed to transcribe');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200">
      {/* Auto-Listening Voice Button (Click to toggle) */}
      <div className="relative">
        <Button
          onClick={isListening ? stopListening : startListening}
          disabled={isAISpeaking}
          className={`
            h-24 w-24 rounded-full transition-all duration-200
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-2xl ring-4 ring-red-300 animate-pulse' 
              : isListening
                ? 'bg-green-500 hover:bg-green-600 scale-105 shadow-xl ring-4 ring-green-300'
                : isAISpeaking
                  ? 'bg-purple-500 hover:bg-purple-600 shadow-lg animate-bounce'
                  : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl'
            }
          `}
        >
          {isAISpeaking ? (
            <Volume2 className="h-12 w-12 text-white animate-pulse" />
          ) : isRecording ? (
            <Mic className="h-12 w-12 text-white animate-pulse" />
          ) : isListening ? (
            <Mic className="h-12 w-12 text-white" />
          ) : (
            <MicOff className="h-12 w-12 text-white" />
          )}
        </Button>

        {/* Waveform visualization */}
        {isRecording && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-red-500 rounded-full transition-all duration-100"
                style={{
                  height: `${8 + audioLevel * 30 * Math.sin(i * 0.5)}px`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        {isAISpeaking ? (
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600 animate-spin" />
            <p className="text-base font-semibold text-purple-700">
              AI is speaking...
            </p>
          </div>
        ) : isRecording ? (
          <p className="text-base font-semibold text-red-600 animate-pulse">
            🎤 Recording... (auto-stops when you stop talking)
          </p>
        ) : isListening ? (
          <p className="text-base font-semibold text-green-600">
            👂 Listening... (start talking anytime)
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Click to enable auto-listening
          </p>
        )}
      </div>

      {/* Transcription Preview */}
      {transcription && (
        <div className="max-w-md p-4 bg-white rounded-xl shadow-md border border-purple-200">
          <p className="text-sm text-gray-700 italic">
            &ldquo;{transcription}&rdquo;
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !isAISpeaking && !transcription && !isListening && (
        <div className="text-center max-w-sm">
          <p className="text-xs text-gray-500">
            Click to enable auto-listening. Just start talking and AI will 
            automatically detect when you start and stop speaking!
          </p>
        </div>
      )}
      
      {/* Listening Active Instructions */}
      {isListening && !isRecording && !isAISpeaking && (
        <div className="text-center max-w-sm">
          <p className="text-xs text-green-600 font-medium">
            ✨ Auto-listening enabled! Start talking anytime.
            AI will auto-detect your voice and respond.
          </p>
        </div>
      )}
    </div>
  );
}

