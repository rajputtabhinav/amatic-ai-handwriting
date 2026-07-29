/**
 * Dashboard Components Barrel Export
 */

// Main Components
export { Canvas, LearningCanvas } from './canvas';
export { AIChat, AILearningChat } from './ai-chat';
export { Panel } from './panel';
export { CanvasSidebar } from './canvas-sidebar';
export { CanvasDrawing } from './canvas-drawing';

// Visual AI Components
export { VisualResponse, CompactVisualResponse } from './visual-response';
export type { VisualResponseProps, VisualResponseResult } from './visual-response';
export { CanvasAIResponse } from './canvas-ai-response';
export type { CanvasAIResponseProps, AIResponseResult } from './canvas-ai-response';
export { ScenePlayer } from './scene-player';
export { SimplePhysicsCanvas } from './physics-canvas';
export { ReasoningDisplay, ReasoningIndicator, ReasoningBubble } from './reasoning-display';
export { FeedbackButtons, DetailedFeedback } from './feedback-buttons';

// UI Components
export { AmaticHeader } from './amatic-header';
export { AmaticToolbar } from './amatic-toolbar';
export { HamburgerMenu } from './hamburger-menu';
export { BackgroundPicker } from './background-picker';
export { ContextMenu } from './context-menu';
export { DragDropOverlay } from './drag-drop-overlay';
export { VoiceConversation } from './voice-conversation';
export { VoiceIndicator } from './voice-indicator';
export { ConversationSections } from './conversation-sections';

// Collaboration Components
export { ShareDialog, CursorOverlay, UserList, CollabError } from './collab';

