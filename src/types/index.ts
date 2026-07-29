/**
 * Shared Types for Amatic.ai
 * 
 * Central location for all shared type definitions
 */

// Canvas Types
export type ToolType = 'select' | 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'arrow' | 'handwriting' | 'image';

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  text?: string;
  color: string;
  strokeWidth: number;
  opacity: number;
  isSelected?: boolean;
  imageUrl?: string;
  imageData?: HTMLImageElement;
}

export interface CanvasProject {
  id: string;
  title: string;
  lastModified: Date;
  elements: CanvasElement[];
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundPattern: string;
}

// Visual AI Types
export interface SVGElement {
  id: string;
  name: string;
  svgCode: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  animations?: string[];
  physicsEnabled?: boolean;
}

export interface PhysicsProperties {
  mass?: number;
  friction?: number;
  restitution?: number;
  isStatic?: boolean;
  velocity?: { x: number; y: number };
  angularVelocity?: number;
}

export interface AnimationTimeline {
  duration: number;
  scenes: TimelineScene[];
}

export interface TimelineScene {
  id: string;
  startTime: number;
  duration: number;
  elements: string[];
  animations: SceneAnimation[];
  narration?: string;
}

export interface SceneAnimation {
  elementId: string;
  type: 'orbit' | 'rotate' | 'flow' | 'grow' | 'fade' | 'move' | 'morph' | 'particles';
  config: Record<string, unknown>;
}

// Voice Types
export type VoiceEmotion = 'neutral' | 'warm' | 'enthusiastic' | 'calm' | 'serious' | 'friendly' | 'professional';
export type VoiceStyle = 'casual' | 'professional' | 'enthusiastic' | 'calm';
export type VoiceStatus = 'inactive' | 'listening' | 'speaking' | 'processing';

export interface VoiceConfig {
  emotion?: VoiceEmotion;
  speed?: number;
  pitch?: number;
  voiceId?: string;
}

// Query Analysis Types
export type AudienceType = 'child' | 'teen' | 'adult' | 'professional' | 'general';
export type EmotionType = 'curious' | 'confused' | 'excited' | 'neutral' | 'urgent' | 'frustrated';

export interface QueryAnalysis {
  audience: AudienceType;
  emotion: EmotionType;
  topic: string;
  visualStyle: 'playful' | 'academic' | 'professional' | 'technical' | 'minimal';
  voiceTone: VoiceStyle;
  suggestedPhysicsPreset?: string;
  keywords: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

// Training Data Types
export interface TrainingLogEntry {
  query: string;
  reasoning?: string;
  svg?: { code: string; elements: SVGElement[] };
  timeline?: AnimationTimeline;
  analysis?: QueryAnalysis;
  voiceEmotion?: string;
  physicsPreset?: string;
  responseTimeMs?: number;
  userId?: string;
  sessionId?: string;
}

export interface FeedbackEntry {
  logId: string;
  type: 'thumbs_up' | 'thumbs_down' | 'report';
  text?: string;
  category?: string;
  userId?: string;
}

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreamingResponse {
  type: 'reasoning' | 'content' | 'complete' | 'error';
  text?: string;
  error?: string;
}

// UI State Types
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

// Component Props Types
export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children?: React.ReactNode;
}

export interface BaseComponentProps extends WithClassName, WithChildren {}

// Re-export from stores for convenience
export type { CanvasElement as StoreCanvasElement, ToolType as StoreToolType } from '@/stores/canvas-store';

