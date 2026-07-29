import { ChatMessage, AIResponse } from './config';
import { generateAnthropicResponse } from './anthropic-service';
import { generateFallbackResponse } from './fallback-service';
import { logger } from '@/lib/logger';

interface AgenticVisualSuggestion {
  type: 'diagram' | 'chart' | 'illustration' | 'flowchart' | 'mindmap';
  elements: string[];
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface AgenticResponse extends Omit<AIResponse, 'visualSuggestions'> {
  visualSuggestions?: AgenticVisualSuggestion[];
}

const AGENTIC_PROMPT = `You are a versatile AI assistant powered by Amatic.ai. Your responses appear on a beautiful canvas with smart auto-formatting.

🎨 AUTO-FORMATTING SYSTEM:
- 🟢 Headings (use •) → Green color
- 🟣 Definitions (Term: explanation) → Purple color  
- 🔵 Code/Technical (code blocks) → Blue color + light blue highlight
- 🟤 Examples (Example:) → Amber color
- ⚫ Bullets (- or →) → Gray, auto-indented
- 🔴 Critical points (use **Important:**) → Red + yellow highlight + wavy underline

⚠️ BE SELECTIVE WITH HIGHLIGHTING:
- Use **Important:** ONLY for the 1-2 MOST CRITICAL points
- Use **Key:** ONLY for absolutely essential information
- Don't overuse ** - keep canvas clean and professional
- Most content should be clean without highlights

✅ GOOD FORMATTING:
• Topic Name:
  Clear explanation text here

Definition: Clear term explanation

- Point 1: Details
- Point 2: Details
  → Sub-point (indented)

**Important: Only use bold for THE most critical point**

Example: Real-world case

[VISUAL: diagram description] ← Triggers diagram placeholder

🎯 CAPABILITIES:
1. Software development and coding assistance
2. Business strategy and analysis
3. Creative writing and content creation
4. Data analysis and research
5. Problem-solving and brainstorming
6. Technical documentation
7. Project planning and management

🧠 CONTENT QUALITY:
- Clear, concise explanations
- Well-structured with visual hierarchy
- Use formatting naturally
- Don't force highlights
- Professional and thorough responses

Provide helpful, actionable responses tailored to any domain!`;

export async function generateAgenticResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  domain: string = 'general'
): Promise<AgenticResponse> {
  
  // Enhanced system prompt with domain-specific guidance
  const domainGuidance = getDomainGuidance(domain);
  const systemPrompt = `${AGENTIC_PROMPT}\n\nDOMAIN FOCUS: ${domain.toUpperCase()}\n${domainGuidance}`;
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  let aiResponse: AIResponse;
  
  try {
    aiResponse = await generateAnthropicResponse(messages, systemPrompt);
  } catch (error) {
    logger.warn('Anthropic service failed, using fallback', error);
    aiResponse = await generateFallbackResponse(messages);
  }

  // Analyze the response for visual suggestions
  const visualSuggestions = analyzeForVisualSuggestions(userMessage, aiResponse.content, domain);

  return {
    ...aiResponse,
    visualSuggestions
  };
}

function getDomainGuidance(domain: string): string {
  switch (domain.toLowerCase()) {
    case 'coding':
    case 'development':
      return `For software development:
- Provide code examples with proper syntax
- Explain concepts with practical implementations
- Suggest best practices and patterns
- Include debugging tips when relevant`;
      
    case 'business':
      return `For business topics:
- Use clear strategic frameworks
- Provide actionable recommendations
- Include relevant metrics and KPIs
- Consider market context`;
      
    case 'creative':
      return `For creative work:
- Encourage innovative thinking
- Provide diverse examples and approaches
- Balance structure with creative freedom
- Suggest visual and narrative elements`;
      
    case 'research':
    case 'analysis':
      return `For research and analysis:
- Use structured methodology
- Provide data-driven insights
- Suggest visualization approaches
- Include relevant references`;
      
    default:
      return `For general assistance:
- Use visual thinking and organization
- Suggest diagrams when helpful
- Break complex ideas into clear components
- Use charts, lists, and organizational tools`;
  }
}

function analyzeForVisualSuggestions(
  userMessage: string, 
  aiResponse: string, 
  domain: string
): AgenticVisualSuggestion[] {
  const suggestions: AgenticVisualSuggestion[] = [];
  const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
  
  // Coding/development visual suggestions
  if (domain === 'coding' || domain === 'development' || combinedText.includes('architecture') || combinedText.includes('system')) {
    if (combinedText.includes('architecture') || combinedText.includes('design') || combinedText.includes('structure')) {
      suggestions.push({
        type: 'diagram',
        elements: ['components', 'connections', 'data flow'],
        description: 'Create an architecture diagram to visualize the system structure',
        priority: 'high'
      });
    }
    
    if (combinedText.includes('flow') || combinedText.includes('process') || combinedText.includes('algorithm')) {
      suggestions.push({
        type: 'flowchart',
        elements: ['steps', 'decisions', 'outcomes'],
        description: 'Create a flowchart to illustrate the process flow',
        priority: 'high'
      });
    }
  }
  
  // Business visual suggestions
  if (domain === 'business' || combinedText.includes('strategy') || combinedText.includes('plan')) {
    if (combinedText.includes('data') || combinedText.includes('metrics') || combinedText.includes('growth')) {
      suggestions.push({
        type: 'chart',
        elements: ['data points', 'trends', 'labels'],
        description: 'Create a chart to visualize the data and trends',
        priority: 'high'
      });
    }
  }
  
  // General visual suggestions
  if (combinedText.includes('compare') || combinedText.includes('difference') || combinedText.includes('versus')) {
    suggestions.push({
      type: 'chart',
      elements: ['comparison table', 'categories', 'differences'],
      description: 'Create a comparison chart to highlight differences and similarities',
      priority: 'medium'
    });
  }
  
  if (combinedText.includes('brainstorm') || combinedText.includes('ideas') || combinedText.includes('concept')) {
    suggestions.push({
      type: 'mindmap',
      elements: ['central topic', 'branches', 'related concepts'],
      description: 'Create a mind map to organize and connect ideas visually',
      priority: 'medium'
    });
  }
  
  return suggestions;
}

export type { AgenticVisualSuggestion, AgenticResponse };
