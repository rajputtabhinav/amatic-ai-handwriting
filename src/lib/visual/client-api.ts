/**
 * Client-side API wrappers for visual AI features
 * 
 * These functions call server-side API routes instead of
 * using OpenRouter directly (which requires server-side API keys)
 */

import type { DetailedQueryAnalysis } from './query-analyzer';
import type { GeneratedTimeline } from './timeline-generator';

export interface GeneratedSVG {
  code: string;
  elements: { id: string; type: string; label?: string }[];
  physics?: unknown;
  metadata: {
    query: string;
    audience: string;
    generatedAt: Date;
  };
}

export type GeneratedVisualization = GeneratedSVG;

/**
 * Default analysis for fallback when API fails
 */
function getDefaultAnalysis(query: string): DetailedQueryAnalysis {
  return {
    audience: 'adult',
    emotion: 'curious',
    topic: 'general',
    visualStyle: 'modern',
    voiceTone: 'professional',
    confidence: 0.5,
    keywords: query.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5),
    suggestedPhysicsPreset: 'balanced',
    voiceSettings: { speed: 1.0, pitch: 1.0, emotion: 'neutral' }
  };
}

/**
 * Analyze query using server-side API
 */
export async function analyzeQueryClient(query: string): Promise<DetailedQueryAnalysis> {
  try {
    const response = await fetch('/api/visual/analyze-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      // Return default analysis on auth or other errors
      console.warn('Query analysis API returned', response.status, '- using default analysis');
      return getDefaultAnalysis(query);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.warn('Query analysis failed:', error);
    return getDefaultAnalysis(query);
  }
}

/**
 * Generate fallback SVG when API fails - shows loading state
 */
function generateFallbackSVG(query: string): GeneratedSVG {
  const safeQuery = query.slice(0, 40).replace(/[<&>]/g, '');
  const code = `
<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="240" fill="#F8FAFC" rx="16" />
  <circle id="focus-node" cx="120" cy="120" r="48" fill="#818CF8" opacity="0.9" />
  <rect id="detail-node" x="210" y="84" width="110" height="72" rx="16" fill="#C7D2FE" />
  <path d="M168 120H210" stroke="#4F46E5" stroke-width="4" stroke-linecap="round" />
  <text x="200" y="210" text-anchor="middle" font-size="18" fill="#334155">${safeQuery}</text>
</svg>`;

  return {
    code,
    elements: [
      { id: 'focus-node', type: 'circle', label: 'Focus' },
      { id: 'detail-node', type: 'rect', label: 'Detail' },
    ],
    metadata: {
      query,
      audience: 'adult',
      generatedAt: new Date()
    }
  };
}

/**
 * Generate SVG using server-side API
 */
export async function generateSVGClient(
  query: string,
  options: {
    style?: 'cartoon' | 'modern' | 'professional' | 'minimal';
    audience?: 'kid' | 'teen' | 'adult' | 'professional';
    includePhysics?: boolean;
  } = {}
): Promise<GeneratedSVG> {
  try {
    const response = await fetch('/api/visual/stream-component', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        style: options.style,
        audience: options.audience,
        includePhysics: options.includePhysics ?? true
      })
    });

    if (!response.ok) {
      // Return fallback SVG on errors
      console.warn('SVG generation API returned', response.status);
      return generateFallbackSVG(query);
    }

    const data = await response.json();
    return {
      code: data.svg,
      elements: data.elements || [],
      physics: data.physics,
      metadata: data.metadata
    };
  } catch (error) {
    console.warn('SVG generation failed:', error);
    return generateFallbackSVG(query);
  }
}

/**
 * Generate fallback timeline when API fails
 */
function generateFallbackTimeline(
  query: string,
  elements: { id: string; type: string; label?: string }[]
): GeneratedTimeline {
  return {
    title: `Explaining: ${query.slice(0, 30)}`,
    duration: 10,
    scenes: [
      {
        time: 0,
        svg_action: { element: elements[0]?.id || 'main-circle', action: 'fadeIn' },
        voice: `Let me explain ${query.slice(0, 50)}.`
      },
      {
        time: 3,
        svg_action: { element: elements[1]?.id || 'main-circle', action: 'highlight' },
        voice: 'Here is the main concept.'
      },
      {
        time: 6,
        svg_action: { element: 'all', action: 'pulse' },
        voice: 'And that completes our visual explanation.'
      }
    ],
    totalVoiceDuration: 10,
    metadata: {
      query,
      elementCount: 0,
      generatedAt: new Date()
    }
  };
}

/**
 * Generate timeline using server-side API
 */
export async function generateTimelineClient(
  query: string,
  elements: { id: string; type: string; label?: string }[],
  options: {
    voiceStyle?: 'casual' | 'professional' | 'enthusiastic' | 'calm';
    pacing?: 'slow' | 'normal' | 'fast';
  } = {}
): Promise<GeneratedTimeline> {
  try {
    const response = await fetch('/api/visual/generate-timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        elements,
        voiceStyle: options.voiceStyle,
        pacing: options.pacing
      })
    });

    if (!response.ok) {
      // Return fallback timeline on errors
      console.warn('Timeline generation API returned', response.status);
      return generateFallbackTimeline(query, elements);
    }

    const data = await response.json();
    return data.timeline;
  } catch (error) {
    console.warn('Timeline generation failed:', error);
    return generateFallbackTimeline(query, elements);
  }
}

