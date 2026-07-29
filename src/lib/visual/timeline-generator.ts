/**
 * Timeline Generator Service
 * 
 * Creates animated scene scripts with voice cues.
 * Synchronizes visual animations with voice narration.
 */

import { createAnthropicClient, type SVGElementData, type AnimationTimeline, type TimelineScene } from '../api/anthropic-client';

export interface TimelineGeneratorOptions {
  duration?: number;
  sceneCount?: number;
  voiceStyle?: 'casual' | 'professional' | 'enthusiastic' | 'calm';
  pacing?: 'slow' | 'normal' | 'fast';
}

export interface GeneratedTimeline extends AnimationTimeline {
  totalVoiceDuration: number;
  metadata: {
    query: string;
    elementCount: number;
    generatedAt: Date;
  };
}

/**
 * Animation actions that can be applied to SVG elements
 */
export const ANIMATION_ACTIONS = {
  fadeIn: {
    name: 'Fade In',
    description: 'Element gradually appears',
    duration: 0.5
  },
  fadeOut: {
    name: 'Fade Out',
    description: 'Element gradually disappears',
    duration: 0.5
  },
  highlight: {
    name: 'Highlight',
    description: 'Element glows or pulses to draw attention',
    duration: 1
  },
  pulse: {
    name: 'Pulse',
    description: 'Element scales up and down rhythmically',
    duration: 1
  },
  orbit: {
    name: 'Orbit',
    description: 'Element rotates around another element',
    duration: 3
  },
  rotate: {
    name: 'Rotate',
    description: 'Element rotates on its axis',
    duration: 2
  },
  flow: {
    name: 'Flow',
    description: 'Element moves along a path',
    duration: 2
  },
  show: {
    name: 'Show',
    description: 'Element becomes visible instantly',
    duration: 0
  },
  hide: {
    name: 'Hide',
    description: 'Element becomes invisible instantly',
    duration: 0
  },
  bounce: {
    name: 'Bounce',
    description: 'Element bounces in place',
    duration: 0.5
  },
  shake: {
    name: 'Shake',
    description: 'Element shakes to indicate importance',
    duration: 0.5
  },
  zoom: {
    name: 'Zoom',
    description: 'Camera zooms to element',
    duration: 1
  }
};

/**
 * Voice pacing configurations
 */
const PACING_CONFIG = {
  slow: {
    wordsPerSecond: 2,
    pauseBetweenScenes: 1.5
  },
  normal: {
    wordsPerSecond: 2.5,
    pauseBetweenScenes: 1
  },
  fast: {
    wordsPerSecond: 3,
    pauseBetweenScenes: 0.5
  }
};

/**
 * Generate animation timeline from SVG elements
 */
export async function generateTimeline(
  query: string,
  elements: SVGElementData[],
  options: TimelineGeneratorOptions = {}
): Promise<GeneratedTimeline> {
  const {
    duration = 15,
    sceneCount = 5,
    voiceStyle = 'professional',
    pacing = 'normal'
  } = options;

  const client = createAnthropicClient();
  const elementList = formatElementList(elements);

  const systemPrompt = buildTimelineSystemPrompt(voiceStyle, sceneCount);
  const prompt = buildTimelinePrompt(query, elementList, duration);

  let fullContent = '';
  
  for await (const chunk of client.streamReasoning(prompt, systemPrompt)) {
    if (chunk.type === 'content') {
      fullContent += chunk.text;
    }
  }

  // Parse timeline from AI response
  const timeline = parseTimelineFromResponse(fullContent, query, elements, duration);
  
  // Calculate voice durations
  const totalVoiceDuration = calculateVoiceDuration(timeline.scenes, pacing);

  return {
    ...timeline,
    totalVoiceDuration,
    metadata: {
      query,
      elementCount: elements.length,
      generatedAt: new Date()
    }
  };
}

/**
 * Format element list for AI prompt
 */
function formatElementList(elements: SVGElementData[]): string {
  if (elements.length === 0) {
    return 'No specific elements available - create generic scene transitions';
  }

  return elements
    .map(e => `- ${e.id} (${e.type})${e.label ? `: "${e.label}"` : ''}`)
    .join('\n');
}

/**
 * Build system prompt for timeline generation
 */
function buildTimelineSystemPrompt(voiceStyle: string, sceneCount: number): string {
  const styleGuide = {
    casual: 'friendly, conversational, uses simple words',
    professional: 'clear, informative, educational',
    enthusiastic: 'excited, engaging, uses exclamations',
    calm: 'soothing, patient, measured pace'
  };

  return `You are an educational animation director. Create scene-by-scene animation timelines that synchronize visuals with voice narration.

VOICE STYLE: ${styleGuide[voiceStyle as keyof typeof styleGuide] || styleGuide.professional}

OUTPUT FORMAT (JSON only):
{
  "title": "Brief title",
  "duration": <total seconds>,
  "scenes": [
    {
      "time": <start time in seconds>,
      "svg_action": {
        "element": "<element_id>",
        "action": "<fadeIn|fadeOut|highlight|pulse|orbit|rotate|flow|show|hide|bounce|shake|zoom>",
        "animation": "<optional: additional details like 'orbitAround(sun)' or 'flowToward(target)'>"
      },
      "voice": "<what narrator says - keep each line 3-15 words>"
    }
  ]
}

RULES:
1. Create exactly ${sceneCount} scenes
2. First scene introduces the topic
3. Each scene builds on the previous
4. Last scene summarizes
5. Match animations to what's being explained
6. Voice lines should be natural and engaging
7. Output ONLY valid JSON - no other text`;
}

/**
 * Build prompt for timeline generation
 */
function buildTimelinePrompt(query: string, elementList: string, duration: number): string {
  return `Create an animation timeline for explaining: "${query}"

Available SVG elements:
${elementList}

Total duration: ${duration} seconds

Remember: Output ONLY the JSON, starting with { and ending with }`;
}

/**
 * Parse timeline from AI response
 */
function parseTimelineFromResponse(
  content: string,
  query: string,
  elements: SVGElementData[],
  duration: number
): AnimationTimeline {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and return
      if (parsed.scenes && Array.isArray(parsed.scenes)) {
        return {
          title: parsed.title || `Explaining: ${query}`,
          duration: parsed.duration || duration,
          scenes: validateScenes(parsed.scenes, elements)
        };
      }
    }
  } catch {
    // Fall through to default
  }

  // Generate default timeline
  return generateDefaultTimeline(query, elements, duration);
}

/**
 * Validate scenes have valid element references
 */
function validateScenes(scenes: TimelineScene[], elements: SVGElementData[]): TimelineScene[] {
  const elementIds = new Set(elements.map(e => e.id));
  
  return scenes.map(scene => {
    // If element doesn't exist, use first available or 'all'
    if (!elementIds.has(scene.svg_action.element) && scene.svg_action.element !== 'all') {
      scene.svg_action.element = elements[0]?.id || 'main-element';
    }
    
    // Validate action
    if (!Object.keys(ANIMATION_ACTIONS).includes(scene.svg_action.action)) {
      scene.svg_action.action = 'highlight';
    }

    return scene;
  });
}

/**
 * Generate default timeline when AI fails
 */
function generateDefaultTimeline(
  query: string,
  elements: SVGElementData[],
  duration: number
): AnimationTimeline {
  const sceneInterval = duration / 4;
  const safeElements = elements.length > 0 ? elements : [{ id: 'main-element', type: 'g' as const }];

  const scenes: TimelineScene[] = [
    {
      time: 0,
      svg_action: { element: safeElements[0].id, action: 'fadeIn' },
      voice: `Let me explain ${query.slice(0, 30)}.`
    },
    {
      time: sceneInterval,
      svg_action: { element: safeElements[Math.min(1, safeElements.length - 1)].id, action: 'highlight' },
      voice: 'Here we can see the main concept at work.'
    },
    {
      time: sceneInterval * 2,
      svg_action: { element: safeElements[Math.min(2, safeElements.length - 1)].id, action: 'pulse' },
      voice: 'Notice how these elements interact together.'
    },
    {
      time: sceneInterval * 3,
      svg_action: { element: 'all', action: 'highlight' },
      voice: 'And that completes our explanation!'
    }
  ];

  return {
    title: `Explaining: ${query}`,
    duration,
    scenes
  };
}

/**
 * Calculate total voice duration
 */
function calculateVoiceDuration(
  scenes: TimelineScene[],
  pacing: 'slow' | 'normal' | 'fast'
): number {
  const config = PACING_CONFIG[pacing];
  
  let totalDuration = 0;
  for (const scene of scenes) {
    const wordCount = scene.voice.split(/\s+/).length;
    const speechDuration = wordCount / config.wordsPerSecond;
    totalDuration += speechDuration + config.pauseBetweenScenes;
  }

  return Math.round(totalDuration * 10) / 10;
}

/**
 * Get voice text for all scenes
 */
export function extractVoiceScript(timeline: AnimationTimeline): string {
  return timeline.scenes
    .map(scene => scene.voice)
    .join(' ');
}

/**
 * Get scene at specific time
 */
export function getSceneAtTime(timeline: AnimationTimeline, time: number): TimelineScene | null {
  // Find the last scene that starts at or before the given time
  let currentScene: TimelineScene | null = null;
  
  for (const scene of timeline.scenes) {
    if (scene.time <= time) {
      currentScene = scene;
    } else {
      break;
    }
  }

  return currentScene;
}

/**
 * Merge multiple timelines
 */
export function mergeTimelines(...timelines: AnimationTimeline[]): AnimationTimeline {
  const allScenes: TimelineScene[] = [];
  let offset = 0;

  for (const timeline of timelines) {
    for (const scene of timeline.scenes) {
      allScenes.push({
        ...scene,
        time: scene.time + offset
      });
    }
    offset += timeline.duration;
  }

  return {
    title: timelines[0]?.title || 'Merged Timeline',
    duration: offset,
    scenes: allScenes.sort((a, b) => a.time - b.time)
  };
}

// Default export
export default {
  generateTimeline,
  extractVoiceScript,
  getSceneAtTime,
  mergeTimelines,
  ANIMATION_ACTIONS,
  PACING_CONFIG
};

