/**
 * Auto Visual Generator
 * Automatically generates diagrams and formulas based on AI responses
 * NO GIFs - only clean, focused visual materials
 */

export interface VisualContent {
  images: string[];
  formulas: string[];
  needsDiagram: boolean;
  hasFormulas: boolean;
}

export interface ContentAnalysis {
  topic: string;
  complexity: 'simple' | 'moderate' | 'complex';
  needsDiagram: boolean;
  diagramPrompt: string;
  hasFormulas: boolean;
  extractedFormulas: string[];
  suggestedVisualType: 'diagram' | 'flowchart' | 'graph' | 'illustration' | 'none';
}

/**
 * Analyze AI response to determine what visuals would be helpful
 */
export async function analyzeContentForVisuals(aiResponse: string, userQuestion?: string): Promise<ContentAnalysis> {
  // Call DeepSeek R1 to analyze what visuals would help
  const analysisPrompt = `Analyze this content and determine what visual aids would be most helpful:

User Question: ${userQuestion || 'N/A'}
AI Response: ${aiResponse}

Determine:
1. What is the main topic/subject?
2. Would a diagram or illustration help? If yes, describe what to draw.
3. Are there any mathematical formulas or equations? Extract them.
4. What type of visual would be most effective?

Respond in JSON format:
{
  "topic": "string",
  "needsDiagram": boolean,
  "diagramPrompt": "string (detailed prompt for image generation)",
  "hasFormulas": boolean,
  "extractedFormulas": ["string array of LaTeX formulas"],
  "suggestedVisualType": "diagram|flowchart|graph|illustration|none"
}`;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: analysisPrompt,
        conversationHistory: []
      })
    });

    if (!response.ok) {
      // Gracefully handle API not available
      console.warn('Chat API not available for content analysis, using fallback');
      // Fall through to fallback analysis
    } else {
      const data = await response.json();
      
      // Parse JSON from response
      const jsonMatch = data.response?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const analysis = JSON.parse(jsonMatch[0]);
          return {
            topic: analysis.topic || 'General',
            complexity: 'moderate',
            needsDiagram: analysis.needsDiagram || false,
            diagramPrompt: analysis.diagramPrompt || '',
            hasFormulas: analysis.hasFormulas || false,
            extractedFormulas: analysis.extractedFormulas || [],
            suggestedVisualType: analysis.suggestedVisualType || 'none'
          };
        } catch (parseError) {
          console.warn('Failed to parse analysis response, using fallback');
          // Fall through to fallback analysis
        }
      }
    }
  } catch (error) {
    console.warn('Error analyzing content, using fallback:', error);
    // Fall through to fallback analysis
  }

  // Fallback: simple keyword analysis
  return {
    topic: 'General',
    complexity: 'moderate',
    needsDiagram: /diagram|draw|illustrate|show|visualize/i.test(aiResponse),
    diagramPrompt: '',
    hasFormulas: /\$|formula|equation|=|\\frac|\\sum/i.test(aiResponse),
    extractedFormulas: extractFormulasSimple(aiResponse),
    suggestedVisualType: 'none'
  };
}

/**
 * Simple formula extraction as fallback
 */
function extractFormulasSimple(text: string): string[] {
  const formulas: string[] = [];
  
  // Match LaTeX-style formulas
  const latexMatches = text.match(/\$\$?[^$]+\$\$?/g);
  if (latexMatches) {
    formulas.push(...latexMatches.map(f => f.replace(/\$/g, '')));
  }
  
  // Match simple equations (e.g., F = ma, E = mc²)
  const equationMatches = text.match(/[A-Z][a-z]?\s*=\s*[^.,\s][^.,]*/g);
  if (equationMatches) {
    formulas.push(...equationMatches);
  }
  
  return formulas;
}

/**
 * Generate diagram using image generation API
 */
export async function generateDiagram(prompt: string): Promise<string | null> {
  if (!prompt) return null;

  try {
    // Enhance prompt for clarity
    const enhancedPrompt = `Diagram, clean and simple illustration style: ${prompt}. 
    Clear labels, minimalist design, black and white line art with colored highlights. 
    Professional quality, easy to understand.`;

    // Call your image generation API (DALL-E or similar)
    const response = await fetch('/api/generate-illustration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        style: 'educational',
        size: '1024x1024'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate diagram');
    }

    const data = await response.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error('Error generating diagram:', error);
    return null;
  }
}

/**
 * Main function: Generate all visuals for AI response
 */
export async function generateVisuals(aiResponse: string, userQuestion?: string): Promise<VisualContent> {
  // Analyze what visuals are needed
  const analysis = await analyzeContentForVisuals(aiResponse, userQuestion);
  
  // Generate in parallel (images and formulas only - NO GIFs)
  const [imageUrl] = await Promise.all([
    analysis.needsDiagram ? generateDiagram(analysis.diagramPrompt) : Promise.resolve(null)
  ]);
  
  return {
    images: imageUrl ? [imageUrl] : [],
    formulas: analysis.extractedFormulas,
    needsDiagram: analysis.needsDiagram,
    hasFormulas: analysis.hasFormulas
  };
}

/**
 * Render visuals on canvas
 * This function will be called by the canvas component
 */
export async function renderVisualsOnCanvas(content: {
  text: string;
  images: string[];
  formulas: string[];
  position?: 'append-below' | 'replace';
}): Promise<void> {
  // This will be implemented in the canvas component
  // For now, just dispatch an event that the canvas can listen to
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ai-visual-generated', {
      detail: content
    }));
  }
}

