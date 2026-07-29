/**
 * Context-Aware AI Service
 * 
 * Enhances AI with full canvas spatial awareness.
 * AI receives structured canvas data (no screenshots) and responds contextually.
 */

import { CanvasElement } from '@/stores/canvas-store';
import { SpatialContext } from '@/lib/canvas/spatial-context';
import { ActivitySummary } from '@/lib/canvas/activity-stream';
import { DetectedGesture } from '@/lib/canvas/gesture-detector';
import { ChatMessage } from '@/lib/ai/config';
import { generateAgenticResponse } from '@/lib/ai/agentic-service';

export interface CanvasAwareContext {
  elements: CanvasElement[];
  spatialContext: SpatialContext;
  activitySummary: ActivitySummary;
  detectedGesture?: DetectedGesture;
  conversationHistory: ChatMessage[];
}

export interface ContextAwareResponse {
  content: string;
  voiceScript: string;
  needsVisual: boolean;
  visualDescription?: string;
  annotations: Annotation[];
  spatialReferences: string[];
}

export interface Annotation {
  type: 'highlight' | 'arrow' | 'circle' | 'underline';
  targetElementId: string;
  position?: { x: number; y: number };
  color?: string;
  label?: string;
}

/**
 * Generate context-aware AI response with full canvas understanding
 */
export async function generateContextAwareResponse(
  userQuery: string,
  context: CanvasAwareContext
): Promise<ContextAwareResponse> {
  
  // Build rich context prompt (text description, no image)
  const contextPrompt = buildContextPrompt(userQuery, context);
  
  // Generate response with enhanced context
  const aiResponse = await generateAgenticResponse(
    contextPrompt,
    context.conversationHistory,
    'education'
  );
  
  // Parse response into multimodal components
  return parseMultimodalResponse(aiResponse.content, context);
}

/**
 * Build comprehensive context prompt for AI
 */
function buildContextPrompt(
  userQuery: string,
  context: CanvasAwareContext
): string {
  
  const prompt = `
YOU ARE AN INTELLIGENT TUTOR with FULL SPATIAL AWARENESS of the canvas.

═══════════════════════════════════════════════════════════
CANVAS STATE (Real-time structured data, NO screenshot):
═══════════════════════════════════════════════════════════

ELEMENTS ON CANVAS (${context.elements.length} total):
${context.elements.map((el, i) => {
  const creator = el.id.startsWith('ai-') ? '[You created this]' : '[Student created]';
  return `${i + 1}. ${describeElement(el)} ${creator}`;
}).join('\n')}

SPATIAL RELATIONSHIPS:
${describeSpatialRelationships(context.elements)}

═══════════════════════════════════════════════════════════
USER ACTIVITY (Real-time tracking):
═══════════════════════════════════════════════════════════

CURRENT GESTURE: ${context.detectedGesture?.type || 'none'}
${context.detectedGesture?.description || ''}

USER INTENT: ${context.activitySummary.userIntent}

CURRENT FOCUS: ${context.activitySummary.currentFocus || 'None'}

RECENT ACTIVITY:
${context.activitySummary.recentActions.join('\n')}

CURSOR POSITION: (${context.spatialContext.cursorPosition.x}, ${context.spatialContext.cursorPosition.y})
${context.spatialContext.pointedElement ? `POINTING AT: ${describeElement(context.spatialContext.pointedElement)}` : ''}

${context.spatialContext.underlinedElements.length > 0 ? `UNDERLINED: ${context.spatialContext.underlinedElements.map(el => el.text).join(', ')}` : ''}

${context.spatialContext.circledElements.length > 0 ? `CIRCLED: ${context.spatialContext.circledElements.length} element(s)` : ''}

═══════════════════════════════════════════════════════════
CONVERSATION HISTORY:
═══════════════════════════════════════════════════════════

${context.conversationHistory.slice(-3).map(m => `${m.role}: ${m.content.substring(0, 100)}...`).join('\n')}

═══════════════════════════════════════════════════════════
USER QUERY:
═══════════════════════════════════════════════════════════

"${userQuery}"

${context.detectedGesture?.intent ? `IMPLICIT INTENT (from gesture): ${context.detectedGesture.intent}` : ''}

═══════════════════════════════════════════════════════════
YOUR RESPONSE REQUIREMENTS:
═══════════════════════════════════════════════════════════

1. VOICE_SCRIPT: Natural spoken explanation (conversational, like a tutor)
2. VISUAL_NEEDED: true/false (should you generate a new diagram?)
3. VISUAL_DESCRIPTION: If needed, describe what to illustrate
4. ANNOTATIONS: Highlights/arrows to add to EXISTING canvas elements
5. SPATIAL_REFERENCES: Use spatial language ("the diagram above", "this part here")

RESPOND CONTEXTUALLY - you have FULL awareness of the canvas state!
Reference specific elements by their position and what they show.
`;

  return prompt;
}

/**
 * Describe element for AI context
 */
function describeElement(element: CanvasElement): string {
  const pos = `at (${Math.round(element.x)}, ${Math.round(element.y)})`;
  
  switch (element.type) {
    case 'text':
      return `Text: "${element.text}" ${pos}`;
    
    case 'handwriting':
      return `Handwritten: "${element.text}" ${pos}`;
    
    case 'react-illustration':
      const style = element.illustrationStyle || 'diagram';
      return `Illustration (${style} style) ${pos}, size: ${element.width}x${element.height}`;
    
    case 'svg-image':
      return `SVG diagram ${pos}, size: ${element.width}x${element.height}`;
    
    case 'pen':
      return `Pen stroke ${pos}`;
    
    case 'rectangle':
      return `Rectangle ${element.width}x${element.height} ${pos}`;
    
    case 'circle':
      return `Circle (radius ${element.width}) ${pos}`;
    
    case 'arrow':
      return `Arrow ${pos}`;
    
    default:
      return `${element.type} ${pos}`;
  }
}

/**
 * Describe spatial relationships between elements
 */
function describeSpatialRelationships(elements: CanvasElement[]): string {
  if (elements.length < 2) return 'Single element on canvas';
  
  const relationships: string[] = [];
  
  // Find clusters and relationships
  elements.forEach((el, i) => {
    const nearby = elements.filter((other, j) => {
      if (i === j) return false;
      const distance = Math.sqrt(
        Math.pow(other.x - el.x, 2) + 
        Math.pow(other.y - el.y, 2)
      );
      return distance < 200;
    });
    
    if (nearby.length > 0) {
      relationships.push(
        `Element ${i + 1} (${el.type}) is near ${nearby.length} other element(s)`
      );
    }
  });
  
  return relationships.slice(0, 5).join('\n') || 'Elements are spread across canvas';
}

/**
 * Parse AI response into multimodal components
 */
function parseMultimodalResponse(
  aiContent: string,
  context: CanvasAwareContext
): ContextAwareResponse {
  
  // Extract voice script (main content)
  const voiceScript = aiContent;
  
  // Detect if visual is needed based on query type
  const needsVisual = detectVisualNeed(aiContent, context);
  
  // Extract spatial references
  const spatialReferences = extractSpatialReferences(aiContent);
  
  // Generate annotations based on context
  const annotations = generateAnnotations(context);
  
  return {
    content: aiContent,
    voiceScript,
    needsVisual,
    visualDescription: needsVisual ? extractVisualDescription(aiContent) : undefined,
    annotations,
    spatialReferences
  };
}

/**
 * Detect if response needs visual generation
 */
function detectVisualNeed(content: string, context: CanvasAwareContext): boolean {
  // If user asked "explain" or "what is", likely needs visual
  const explainKeywords = /explain|what is|how does|show me|visualize/i;
  if (explainKeywords.test(content)) return true;
  
  // If pointing at non-visual element, might need visual
  if (context.spatialContext.pointedElement?.type === 'text') return true;
  
  // If underlining concept, expand with visual
  if (context.spatialContext.underlinedElements.length > 0) return true;
  
  return false;
}

/**
 * Extract spatial references from AI response
 */
function extractSpatialReferences(content: string): string[] {
  const references: string[] = [];
  const patterns = [
    /the diagram (above|below|to the left|to the right)/gi,
    /this (part|element|section)/gi,
    /that (diagram|illustration|text)/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      references.push(...matches);
    }
  });
  
  return references;
}

/**
 * Extract visual description from AI response
 */
function extractVisualDescription(content: string): string {
  // Look for visual description markers
  const visualMatch = content.match(/\[VISUAL: ([^\]]+)\]/i);
  if (visualMatch) {
    return visualMatch[1];
  }
  
  // Default: use first sentence as visual description
  const firstSentence = content.split('.')[0];
  return firstSentence;
}

/**
 * Generate annotations based on context
 */
function generateAnnotations(context: CanvasAwareContext): Annotation[] {
  const annotations: Annotation[] = [];
  
  // If user is pointing, add highlight annotation
  if (context.spatialContext.pointedElement) {
    annotations.push({
      type: 'highlight',
      targetElementId: context.spatialContext.pointedElement.id,
      color: '#fbbf24'
    });
  }
  
  // If user underlined, add arrow annotation
  context.spatialContext.underlinedElements.forEach(el => {
    annotations.push({
      type: 'underline',
      targetElementId: el.id,
      color: '#3b82f6'
    });
  });
  
  // If user circled, add circle annotation
  context.spatialContext.circledElements.forEach(el => {
    annotations.push({
      type: 'circle',
      targetElementId: el.id,
      color: '#ef4444'
    });
  });
  
  return annotations;
}

// Default export
export default {
  generateContextAwareResponse
};

