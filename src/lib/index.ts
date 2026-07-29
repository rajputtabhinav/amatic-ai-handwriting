/**
 * Main Library Barrel Export
 * 
 * Central export point for all library modules
 */

// AI Services
export * from './ai/config';
export * from './ai/ai-service';
export * from './ai/fallback-service';

// Visual AI - explicitly export to avoid conflicts
// TODO: Re-enable when svg-generator is implemented
// export {
//   generateSVG,
//   type SVGGeneratorOptions,
//   type GeneratedSVG,
// } from './visual/svg-generator';

export {
  generateTimeline,
  type GeneratedTimeline,
} from './visual/timeline-generator';

// TODO: Re-enable when svg-animator is implemented
// export {
//   SVGAnimator,
//   type AnimationState,
//   type AnimationDefinition,
//   type AnimationType,
//   type EasingFunction,
//   type AnimationConfig,
// } from './visual/svg-animator';

export {
  analyzeQueryLocally,
  analyzeQueryWithAI,
} from './visual/query-analyzer';

// Physics
export * from './physics';

// Reasoning
export * from './reasoning';

// Voice
export * from './voice/emotion-voice';
export * from './voice/voice-sync';
export * from './voice/voice-types';

// Training Data
export * from './training';

// API Clients - avoid duplicate AnimationConfig export
export {
  createAnthropicClient,
  createAnthropicClient as createOpenRouterClient, // Backward compatibility
  type SVGGenerationResult,
  type SVGElementData,
  type PhysicsProperties,
} from './api/anthropic-client';

// Utilities
export * from './env';
export * from './logger';

