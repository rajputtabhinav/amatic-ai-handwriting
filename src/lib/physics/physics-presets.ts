/**
 * Physics Presets
 * 
 * Topic-based physics configurations for different types of content.
 * Each preset defines gravity, element behaviors, and animations.
 */

export interface PhysicsPreset {
  name: string;
  description: string;
  world: {
    gravity: { x: number; y: number };
    airFriction: number;
    timescale: number;
  };
  defaultBodyOptions: {
    friction: number;
    restitution: number;
    density: number;
  };
  animations: AnimationPreset[];
}

export interface AnimationPreset {
  trigger: string | RegExp;
  type: AnimationType;
  config: AnimationConfig;
}

export type AnimationType = 
  | 'orbit'
  | 'rotate'
  | 'pulse'
  | 'flow'
  | 'bounce'
  | 'float'
  | 'shake'
  | 'fadeInOut'
  | 'particles'
  | 'wave';

export interface AnimationConfig {
  speed?: number;
  amplitude?: number;
  frequency?: number;
  target?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'circular';
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  loop?: boolean;
  delay?: number;
}

/**
 * Science preset - Full gravity, particles, reactions
 */
export const SCIENCE_PRESET: PhysicsPreset = {
  name: 'science',
  description: 'Full gravity with particles - things fall, flow, and react',
  world: {
    gravity: { x: 0, y: 0.5 },
    airFriction: 0.01,
    timescale: 1
  },
  defaultBodyOptions: {
    friction: 0.1,
    restitution: 0.5,
    density: 0.001
  },
  animations: [
    { trigger: /sun|light|energy/i, type: 'pulse', config: { speed: 1, amplitude: 0.1 } },
    { trigger: /particle|ray|beam/i, type: 'particles', config: { speed: 2, direction: 'down' } },
    { trigger: /water|liquid|drop/i, type: 'flow', config: { speed: 0.5, direction: 'down' } },
    { trigger: /plant|grow/i, type: 'pulse', config: { speed: 0.5, amplitude: 0.05 } },
    { trigger: /arrow|flow/i, type: 'pulse', config: { speed: 0.3, amplitude: 0.1 } }
  ]
};

/**
 * Space preset - Zero gravity, orbital mechanics
 */
export const SPACE_PRESET: PhysicsPreset = {
  name: 'space',
  description: 'Zero gravity with orbital motion - celestial mechanics',
  world: {
    gravity: { x: 0, y: 0 },
    airFriction: 0,
    timescale: 1
  },
  defaultBodyOptions: {
    friction: 0,
    restitution: 1,
    density: 0.001
  },
  animations: [
    { trigger: /sun|star/i, type: 'pulse', config: { speed: 0.5, amplitude: 0.05 } },
    { trigger: /earth|planet/i, type: 'orbit', config: { speed: 0.3, target: 'sun' } },
    { trigger: /moon|satellite/i, type: 'orbit', config: { speed: 0.8, target: 'earth' } },
    { trigger: /comet|asteroid/i, type: 'orbit', config: { speed: 1.5, target: 'sun' } },
    { trigger: /star/i, type: 'pulse', config: { speed: 2, amplitude: 0.2 } }
  ]
};

/**
 * Biology/Anatomy preset - Organic, pulsing motion
 */
export const BIOLOGY_PRESET: PhysicsPreset = {
  name: 'biology',
  description: 'Organic motion - cells pulse, blood flows, organisms breathe',
  world: {
    gravity: { x: 0, y: 0.1 },
    airFriction: 0.02,
    timescale: 0.8
  },
  defaultBodyOptions: {
    friction: 0.3,
    restitution: 0.3,
    density: 0.002
  },
  animations: [
    { trigger: /heart/i, type: 'pulse', config: { speed: 1.2, amplitude: 0.15, easing: 'easeInOut' } },
    { trigger: /blood|cell/i, type: 'flow', config: { speed: 0.4, direction: 'circular' } },
    { trigger: /lung|breath/i, type: 'pulse', config: { speed: 0.3, amplitude: 0.2 } },
    { trigger: /muscle/i, type: 'pulse', config: { speed: 0.8, amplitude: 0.1 } },
    { trigger: /nerve|signal/i, type: 'particles', config: { speed: 3, direction: 'right' } }
  ]
};

/**
 * Technology/Coding preset - Data flow, digital motion
 */
export const TECHNOLOGY_PRESET: PhysicsPreset = {
  name: 'technology',
  description: 'Data flow - blocks stack, data streams, connections pulse',
  world: {
    gravity: { x: 0, y: 0.3 },
    airFriction: 0.05,
    timescale: 1.2
  },
  defaultBodyOptions: {
    friction: 0.2,
    restitution: 0.2,
    density: 0.001
  },
  animations: [
    { trigger: /data|stream/i, type: 'flow', config: { speed: 1, direction: 'right' } },
    { trigger: /server|computer/i, type: 'pulse', config: { speed: 0.5, amplitude: 0.03 } },
    { trigger: /packet|message/i, type: 'particles', config: { speed: 2, direction: 'right' } },
    { trigger: /database|storage/i, type: 'pulse', config: { speed: 0.2, amplitude: 0.02 } },
    { trigger: /connection|link/i, type: 'pulse', config: { speed: 1, amplitude: 0.1 } }
  ]
};

/**
 * Math preset - Precise, balanced motion
 */
export const MATH_PRESET: PhysicsPreset = {
  name: 'math',
  description: 'Precise motion - equations balance, graphs animate smoothly',
  world: {
    gravity: { x: 0, y: 0 },
    airFriction: 0.1,
    timescale: 0.8
  },
  defaultBodyOptions: {
    friction: 0.5,
    restitution: 0.8,
    density: 0.001
  },
  animations: [
    { trigger: /graph|curve/i, type: 'wave', config: { speed: 0.5, amplitude: 0.5 } },
    { trigger: /point|vertex/i, type: 'pulse', config: { speed: 0.3, amplitude: 0.05 } },
    { trigger: /line|axis/i, type: 'fadeInOut', config: { speed: 0.5 } },
    { trigger: /equation|formula/i, type: 'pulse', config: { speed: 0.2, amplitude: 0.02 } },
    { trigger: /number|digit/i, type: 'bounce', config: { speed: 0.5, amplitude: 0.1 } }
  ]
};

/**
 * History preset - Timeline, sequential events
 */
export const HISTORY_PRESET: PhysicsPreset = {
  name: 'history',
  description: 'Timeline motion - events appear sequentially, dominoes fall',
  world: {
    gravity: { x: 0.1, y: 0.5 },
    airFriction: 0.02,
    timescale: 0.7
  },
  defaultBodyOptions: {
    friction: 0.3,
    restitution: 0.3,
    density: 0.002
  },
  animations: [
    { trigger: /event|date/i, type: 'fadeInOut', config: { speed: 0.5, delay: 0.5 } },
    { trigger: /arrow|timeline/i, type: 'flow', config: { speed: 0.3, direction: 'right' } },
    { trigger: /era|period/i, type: 'pulse', config: { speed: 0.2, amplitude: 0.05 } },
    { trigger: /person|figure/i, type: 'fadeInOut', config: { speed: 0.3 } },
    { trigger: /building|monument/i, type: 'shake', config: { speed: 0.1, amplitude: 0.02 } }
  ]
};

/**
 * Business preset - Floating, magnetic interactions
 */
export const BUSINESS_PRESET: PhysicsPreset = {
  name: 'business',
  description: 'Magnetic floating - elements attract/repel, charts grow',
  world: {
    gravity: { x: 0, y: -0.1 },
    airFriction: 0.05,
    timescale: 0.9
  },
  defaultBodyOptions: {
    friction: 0.1,
    restitution: 0.6,
    density: 0.0005
  },
  animations: [
    { trigger: /chart|graph|bar/i, type: 'pulse', config: { speed: 0.3, amplitude: 0.1 } },
    { trigger: /arrow|trend/i, type: 'flow', config: { speed: 0.5, direction: 'up' } },
    { trigger: /money|dollar|profit/i, type: 'float', config: { speed: 0.3, amplitude: 0.2 } },
    { trigger: /connection|network/i, type: 'pulse', config: { speed: 0.5, amplitude: 0.1 } },
    { trigger: /icon|symbol/i, type: 'bounce', config: { speed: 0.5, amplitude: 0.1 } }
  ]
};

/**
 * Balanced preset - Default for general content
 */
export const BALANCED_PRESET: PhysicsPreset = {
  name: 'balanced',
  description: 'Balanced physics for general content',
  world: {
    gravity: { x: 0, y: 0.3 },
    airFriction: 0.02,
    timescale: 1
  },
  defaultBodyOptions: {
    friction: 0.2,
    restitution: 0.4,
    density: 0.001
  },
  animations: [
    { trigger: /main|primary/i, type: 'pulse', config: { speed: 0.5, amplitude: 0.05 } },
    { trigger: /arrow|flow/i, type: 'pulse', config: { speed: 0.3, amplitude: 0.1 } },
    { trigger: /text|label/i, type: 'fadeInOut', config: { speed: 0.3 } },
    { trigger: /circle|point/i, type: 'pulse', config: { speed: 0.4, amplitude: 0.05 } },
    { trigger: /.*/i, type: 'fadeInOut', config: { speed: 0.5 } }
  ]
};

/**
 * All presets indexed by name
 */
export const PHYSICS_PRESETS: Record<string, PhysicsPreset> = {
  science: SCIENCE_PRESET,
  space: SPACE_PRESET,
  biology: BIOLOGY_PRESET,
  anatomy: BIOLOGY_PRESET,
  technology: TECHNOLOGY_PRESET,
  coding: TECHNOLOGY_PRESET,
  math: MATH_PRESET,
  history: HISTORY_PRESET,
  business: BUSINESS_PRESET,
  balanced: BALANCED_PRESET,
  general: BALANCED_PRESET
};

/**
 * Get preset by topic name
 */
export function getPresetForTopic(topic: string): PhysicsPreset {
  const normalizedTopic = topic.toLowerCase().trim();
  return PHYSICS_PRESETS[normalizedTopic] || BALANCED_PRESET;
}

/**
 * Get animation config for an element based on preset
 */
export function getAnimationForElement(
  elementId: string,
  preset: PhysicsPreset
): AnimationPreset | null {
  for (const animation of preset.animations) {
    if (typeof animation.trigger === 'string') {
      if (elementId.toLowerCase().includes(animation.trigger.toLowerCase())) {
        return animation;
      }
    } else if (animation.trigger.test(elementId)) {
      return animation;
    }
  }
  return null;
}

/**
 * Merge two presets
 */
export function mergePresets(base: PhysicsPreset, override: Partial<PhysicsPreset>): PhysicsPreset {
  return {
    ...base,
    ...override,
    world: {
      ...base.world,
      ...override.world
    },
    defaultBodyOptions: {
      ...base.defaultBodyOptions,
      ...override.defaultBodyOptions
    },
    animations: override.animations || base.animations
  };
}

// Default export
export default {
  PHYSICS_PRESETS,
  getPresetForTopic,
  getAnimationForElement,
  mergePresets,
  SCIENCE_PRESET,
  SPACE_PRESET,
  BIOLOGY_PRESET,
  TECHNOLOGY_PRESET,
  MATH_PRESET,
  HISTORY_PRESET,
  BUSINESS_PRESET,
  BALANCED_PRESET
};

