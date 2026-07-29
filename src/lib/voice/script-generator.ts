/**
 * Voice Script Generator
 * 
 * Generates comprehensive 90-95% voice narration scripts.
 * Creates engaging, educational explanations that cover everything
 * text doesn't explain on canvas.
 */

import { createAnthropicClient } from '@/lib/api/anthropic-client';
import type { Concept, VoiceScript, VoiceSegment } from '@/types/master-plan';

export interface ScriptGenerationOptions {
  textRatio: number;  // How much text is on canvas (0.08-0.45)
  audience: 'kid' | 'teen' | 'adult' | 'professional';
  duration?: number;  // Target duration in seconds
  emotionStyle?: 'engaging' | 'professional' | 'enthusiastic';
}

/**
 * Generate comprehensive voice narration script
 */
export async function generateVoiceScript(
  query: string,
  concepts: Concept[],
  options: ScriptGenerationOptions
): Promise<VoiceScript> {
  
  const voiceCoverage = Math.round((1 - options.textRatio) * 100);
  const conceptList = concepts.map((c, i) => `${i + 1}. ${c.name} - ${c.description}`).join('\n');
  
  const durationTarget = options.duration || estimateRequiredDuration(concepts.length);
  
  const client = createAnthropicClient({}, 'technical');
  
  const prompt = `You are an expert educator creating voice narration for visual learning.

TOPIC: "${query}"
AUDIENCE: ${options.audience}
CONCEPTS TO EXPLAIN: ${concepts.length}

${conceptList}

CRITICAL CONTEXT:
- Text on canvas shows ${Math.round(options.textRatio * 100)}% (${options.textRatio < 0.2 ? 'just titles and labels' : options.textRatio > 0.35 ? 'equations, definitions, and principles' : 'key terms and definitions'})
- Your voice must explain the remaining ${voiceCoverage}% in complete, comprehensive detail
- Duration target: ${Math.floor(durationTarget / 60)} minutes ${durationTarget % 60} seconds

YOUR ROLE:
You are the TEACHER. Text is just the chalkboard outline. You must:
- Provide full context and background
- Explain HOW things work (not just WHAT they are)
- Give real-world examples and analogies
- Connect concepts together
- Build understanding progressively
- Make it engaging and memorable
- Use storytelling techniques

STRUCTURE YOUR NARRATION:
1. Introduction (10%) - Hook the learner, explain what we'll explore
2. Foundation (20%) - Core concepts that everything builds on
3. Main Content (50%) - Detailed explanations with examples
4. Synthesis (15%) - How it all connects together
5. Conclusion (5%) - Key takeaways and why it matters

EMOTIONAL ENGAGEMENT:
Use emotion markers to guide voice tone:
- [WARM] for introductions and conclusions
- [EXCITED] for discoveries and insights
- [CURIOUS] for questions and exploration
- [PROFESSIONAL] for technical explanations
- [AMAZED] for surprising facts
- [SERIOUS] for important points

MENTION EACH CONCEPT:
As you explain, reference the visuals by name so users know what to look at.
Example: "Now look at the neuron structure here..." or "See this chloroplast diagram..."

Generate the complete narration script now (${Math.round(durationTarget / 60)}-minute detailed explanation):`;

  try {
    const response = await client.generateText(prompt);
    
    // Parse into segments
    const segments = parseScriptIntoSegments(response, concepts);
    const duration = estimateDuration(response);
    const emotionMarkers = extractEmotionMarkers(response);
    
    return {
      fullScript: response,
      duration,
      segments,
      emotionMarkers
    };
    
  } catch (error) {
    console.error('[ScriptGenerator] Failed to generate script:', error);
    return generateFallbackScript(query, concepts, options);
  }
}

/**
 * Estimate required duration based on concept count
 */
function estimateRequiredDuration(conceptCount: number): number {
  // Rule of thumb: 10-15 seconds per concept
  if (conceptCount <= 10) return 60;  // 1 minute
  if (conceptCount <= 25) return 120;  // 2 minutes
  if (conceptCount <= 50) return 240;  // 4 minutes
  if (conceptCount <= 100) return 360;  // 6 minutes
  return 480;  // 8 minutes for 100+
}

/**
 * Parse script into timed segments
 */
function parseScriptIntoSegments(
  script: string,
  concepts: Concept[]
): VoiceSegment[] {
  
  // Split into sentences
  const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
  const wordsPerSecond = 2.5;
  
  const segments: VoiceSegment[] = [];
  let currentTime = 0;
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    const wordCount = trimmed.split(/\s+/).length;
    const duration = wordCount / wordsPerSecond;
    
    // Find which concepts this sentence mentions
    const highlightVisuals: number[] = [];
    concepts.forEach((concept, i) => {
      const conceptWords = concept.name.toLowerCase().split(' ');
      if (conceptWords.some(word => trimmed.toLowerCase().includes(word))) {
        highlightVisuals.push(i + 1);
      }
    });
    
    // Extract emotion from markers or infer
    const emotion = inferEmotionFromText(trimmed);
    
    // Determine camera action
    const cameraPosition = highlightVisuals.length > 0
      ? calculateCenterOfVisuals(highlightVisuals, concepts)
      : undefined;
    
    segments.push({
      text: trimmed,
      startTime: currentTime,
      endTime: currentTime + duration,
      emotion,
      highlightVisuals,
      cameraPosition
    });
    
    currentTime += duration;
  }
  
  return segments;
}

/**
 * Calculate center position of visuals for camera
 */
function calculateCenterOfVisuals(
  visualIds: number[],
  _concepts: Concept[]
): { x: number; y: number; zoom: number } {
  
  // Simplified - would use actual layout positions in real implementation
  const avgId = visualIds.reduce((sum, id) => sum + id, 0) / visualIds.length;
  
  return {
    x: 300 + (avgId % 5) * 500,
    y: 200 + Math.floor(avgId / 5) * 400,
    zoom: visualIds.length === 1 ? 1.2 : 1.0
  };
}

/**
 * Estimate total duration from script text
 */
function estimateDuration(script: string): number {
  const wordCount = script.split(/\s+/).length;
  return wordCount / 2.5;  // ~2.5 words per second
}

/**
 * Extract emotion markers from script
 */
function extractEmotionMarkers(script: string): Array<{ timestamp: number; emotion: 'warm' | 'excited' | 'professional' | 'curious' | 'amazed' | 'serious' | 'calm' | 'enthusiastic' }> {
  const markers: Array<{ timestamp: number; emotion: 'warm' | 'excited' | 'professional' | 'curious' | 'amazed' | 'serious' | 'calm' | 'enthusiastic' }> = [];
  const emotionPattern = /\[(WARM|EXCITED|CURIOUS|PROFESSIONAL|AMAZED|SERIOUS|CALM|ENTHUSIASTIC)\]/gi;

  let match;

  while ((match = emotionPattern.exec(script)) !== null) {
    const textBefore = script.substring(0, match.index);
    const wordsBefore = textBefore.split(/\s+/).length;
    const timestamp = wordsBefore / 2.5;
    const emotion = match[1].toLowerCase() as 'warm' | 'excited' | 'professional' | 'curious' | 'amazed' | 'serious' | 'calm' | 'enthusiastic';

    markers.push({
      timestamp,
      emotion
    });
  }

  return markers;
}

/**
 * Infer emotion from text content
 */
function inferEmotionFromText(text: string): string {
  const lower = text.toLowerCase();
  
  // Check for emotion markers first
  const markerMatch = text.match(/\[(WARM|EXCITED|CURIOUS|PROFESSIONAL|AMAZED|SERIOUS|CALM|ENTHUSIASTIC)\]/i);
  if (markerMatch) {
    return markerMatch[1].toLowerCase();
  }
  
  // Infer from content
  if (lower.includes('!') || lower.includes('amazing') || lower.includes('incredible')) {
    return 'excited';
  }
  if (lower.includes('?')) {
    return 'curious';
  }
  if (lower.includes('important') || lower.includes('critical')) {
    return 'serious';
  }
  if (lower.includes('notice') || lower.includes('look') || lower.includes('see')) {
    return 'curious';
  }
  if (text.startsWith('Let') || text.startsWith('Welcome') || text.startsWith('Hello')) {
    return 'warm';
  }
  
  return 'professional';
}

/**
 * Generate fallback script when AI fails
 */
function generateFallbackScript(
  query: string,
  concepts: Concept[],
  _options: ScriptGenerationOptions
): VoiceScript {
  
  const intro = `Welcome! Let me explain ${query} through multiple interconnected concepts.`;
  
  const body = concepts.map((concept) => {
    return `${concept.name}: ${concept.description}`;
  }).join(' ');
  
  const conclusion = `And that's how ${query} works. I hope this visual explanation helped you understand!`;
  
  const fullScript = `${intro} ${body} ${conclusion}`;
  
  return {
    fullScript,
    duration: estimateDuration(fullScript),
    segments: parseScriptIntoSegments(fullScript, concepts),
    emotionMarkers: []
  };
}

/**
 * Validate script quality
 */
export function validateScript(script: VoiceScript): {
  isValid: boolean;
  issues: string[];
} {
  
  const issues: string[] = [];
  
  if (script.duration < 30) {
    issues.push('Script too short (< 30 seconds)');
  }
  
  if (script.segments.length < 3) {
    issues.push('Too few segments (need at least 3)');
  }
  
  if (script.fullScript.split(/\s+/).length < 50) {
    issues.push('Script lacks detail (< 50 words)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

export default {
  generateVoiceScript,
  validateScript,
  estimateDuration
};

