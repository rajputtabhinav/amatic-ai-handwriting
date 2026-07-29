"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Mic, 
  Paperclip, 
  X, 
  FileText, 
  Image as ImageIcon,
  Code,
  Book,
  Loader2,
  Volume2,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRealtimeVoice } from '@/hooks/use-realtime-voice';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface AIChatProps {
  canvasElements?: CanvasElement[];
  onCanvasAction?: (response: string, question?: string) => void;
  selectedModel?: string;
  enableVisualMode?: boolean;
  // Streaming props
  onStreamingQuery?: (query: string) => Promise<void>;
  isStreaming?: boolean;
}

interface CanvasElement {
  id: string;
  type: string;
  text?: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

export function AIChat({ 
  canvasElements = [], 
  onCanvasAction, 
  selectedModel = 'deepseek-r1', 
  enableVisualMode = true,
  onStreamingQuery,
  isStreaming = false,
}: AIChatProps) {
  // User context for potential future features
  useUser();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Auto-speak is enabled by default, can be toggled if UI control is added
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time voice conversation hook
  const { voiceStatus, isActive, currentTranscript, toggleVoiceConversation } = useRealtimeVoice({
    onTranscript: (_transcript) => {
      // Voice transcript received
    },
    onAIResponse: async (response) => {
      if (enableVisualMode && onStreamingQuery && currentTranscript?.trim()) {
        try {
          await onStreamingQuery(currentTranscript);
          return;
        } catch (error) {
          logger.error('Voice-triggered streaming error', error);
          toast.error('Failed to generate visual from voice prompt');
        }
      }

      if (onCanvasAction) {
        onCanvasAction(response, currentTranscript);
      }
    },
    onError: (error) => {
      logger.error('Voice error', error);
    }
  });

  const speakText = useCallback(async (text: string) => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    
    try {
      // Use OpenAI TTS endpoint (returns audio buffer directly)
      const response = await fetch('/api/voice/whisper-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: 'nova', // OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer)
          speed: 1.0
        })
      });

      if (!response.ok) {
        throw new Error('Voice synthesis failed');
      }

      // Response is audio buffer, create blob URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl); // Cleanup
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // Fallback to browser speech synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utterance);
        }
      };
      
      await audio.play();
    } catch (error) {
      console.warn('Voice synthesis error, using fallback:', error);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    }
  }, [isSpeaking]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userInput = input;
    setInput('');
    setIsLoading(true);
    
    // Use streaming visual mode if available and no attachments
    if (enableVisualMode && onStreamingQuery && attachments.length === 0) {
      try {
        await onStreamingQuery(userInput);
      } catch (error) {
        logger.error('Streaming error', error);
        toast.error('Failed to generate visual');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Fall back to text-based chat with file attachments
    try {
      const formData = new FormData();
      formData.append('message', userInput);
      formData.append('canvasContext', JSON.stringify(canvasElements));
      formData.append('modelKey', selectedModel);
      attachments.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      if (onCanvasAction && data.response) {
        onCanvasAction(data.response, userInput);
      }

      if (autoSpeak && data.response) {
        speakText(data.response);
      }

      setAttachments([]);
    } catch (error) {
      logger.error('Error sending message', error);
      toast.error('Failed to get response');
      
      const errorText = "I apologize, but I'm having trouble connecting right now. Please try again.";
      if (onCanvasAction) {
        onCanvasAction(errorText, userInput);
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, attachments, enableVisualMode, onStreamingQuery, canvasElements, selectedModel, onCanvasAction, autoSpeak, speakText]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.includes('code') || type.includes('javascript') || type.includes('python')) 
      return <Code className="h-4 w-4" />;
    return <Book className="h-4 w-4" />;
  };

  const isDisabled = isLoading || isActive || isStreaming;

  return (
    <div className="flex flex-col" data-onboarding="chat-input">

      {attachments.length > 0 && (
        <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto pb-1">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 bg-[#1a1a2e] rounded-full px-2.5 py-1 text-xs border border-violet-500/30 text-white/80"
              >
                <span className="text-violet-400">{getFileIcon(file.type)}</span>
                <span className="truncate max-w-[100px]">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-4 w-4 p-0 hover:bg-red-500/20 rounded-full text-white/60 hover:text-red-400"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
        </div>
      )}

      {/* Dynamic Chat Bar - ChatGPT style with Dynamic Island colors */}
      <div 
        className="relative flex items-end gap-1.5 px-2 py-2 transition-all duration-200"
        style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          borderRadius: input.split('\n').length > 1 || input.length > 60 ? '20px' : '24px',
          boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25), 0 0 24px rgba(139, 92, 246, 0.12)',
        }}
      >
        {/* Attach button */}
        <div className="flex items-center mb-0.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
            title="Attach files"
            disabled={isDisabled}
          >
            <Paperclip className="h-[18px] w-[18px]" />
          </Button>
        </div>

        {/* Dynamic Textarea */}
        <div className="flex-1 relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isStreaming ? "AI is thinking..." : "Ask anything..."}
            disabled={isDisabled}
            rows={1}
            data-onboarding="chat-input-field"
            className="chat-input-dark w-full resize-none border-none outline-none ring-0 px-2 py-2 text-[14px] disabled:opacity-50"
            style={{ 
              minHeight: '36px', 
              maxHeight: '150px',
              lineHeight: '1.5',
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 mb-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoiceConversation}
            disabled={isStreaming}
            data-onboarding="voice-button"
            className={`h-9 w-9 p-0 rounded-full transition-all ${
              isActive 
                ? voiceStatus === 'speaking' 
                  ? 'bg-violet-500 hover:bg-violet-400 text-white' 
                  : voiceStatus === 'listening'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-white'
                : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title={isActive ? `Voice Active (${voiceStatus})` : "Start Voice Conversation"}
          >
            {isActive ? (
              voiceStatus === 'speaking' ? (
                <Volume2 className="h-[18px] w-[18px] animate-pulse" />
              ) : voiceStatus === 'listening' ? (
                <Mic className="h-[18px] w-[18px]" />
              ) : (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              )
            ) : (
              <Mic className="h-[18px] w-[18px]" />
            )}
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={(!input.trim() && attachments.length === 0) || isDisabled}
            className="h-9 w-9 p-0 rounded-full bg-violet-500 hover:bg-violet-400 disabled:bg-white/10 disabled:text-white/30 flex-shrink-0 transition-all hover:shadow-lg hover:shadow-violet-500/30"
            title="Send message"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin text-white" />
            ) : (
              <Send className="h-[18px] w-[18px] text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Keep backward compatibility alias
export { AIChat as AILearningChat };
