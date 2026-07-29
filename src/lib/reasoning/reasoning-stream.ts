/**
 * Reasoning Stream Service
 * 
 * Streams real AI thinking from DeepSeek R1 via OpenRouter.
 * Shows the reasoning process to users while illustrations load in background.
 */

import { createAnthropicClient, type StreamChunk } from '../api/anthropic-client';

export interface ReasoningStreamOptions {
  onReasoning?: (text: string) => void;
  onContent?: (text: string) => void;
  onComplete?: (fullReasoning: string, fullContent: string) => void;
  onError?: (error: Error) => void;
}

export interface ReasoningResult {
  reasoning: string;
  content: string;
  duration: number;
}

/**
 * System prompt for visual reasoning
 */
const VISUAL_REASONING_PROMPT = `You are a Visual Reasoning AI. When explaining concepts, you think out loud about:

1. What the user is asking
2. Who they might be (age/expertise level) based on how they asked
3. What visual elements would help explain this
4. How to make it engaging and clear

Your thinking process helps users understand HOW you approach explanations.

After thinking, provide a clear, concise explanation that will accompany the visual.`;

/**
 * Stream reasoning from AI in real-time
 */
export async function streamReasoning(
  query: string,
  options: ReasoningStreamOptions = {}
): Promise<ReasoningResult> {
  const client = createAnthropicClient();
  const startTime = Date.now();
  
  let fullReasoning = '';
  let fullContent = '';

  try {
    for await (const chunk of client.streamReasoning(query, VISUAL_REASONING_PROMPT)) {
      if (chunk.type === 'reasoning') {
        fullReasoning += chunk.text;
        options.onReasoning?.(chunk.text);
      } else if (chunk.type === 'content') {
        fullContent += chunk.text;
        options.onContent?.(chunk.text);
      }
    }

    const duration = Date.now() - startTime;
    options.onComplete?.(fullReasoning, fullContent);

    return { reasoning: fullReasoning, content: fullContent, duration };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options.onError?.(err);
    throw err;
  }
}

/**
 * ReasoningStreamManager class for managing streaming state
 */
export class ReasoningStreamManager {
  private abortController: AbortController | null = null;
  private isStreaming = false;

  /**
   * Check if currently streaming
   */
  get streaming(): boolean {
    return this.isStreaming;
  }

  /**
   * Start streaming reasoning
   */
  async start(
    query: string,
    callbacks: ReasoningStreamOptions
  ): Promise<ReasoningResult> {
    if (this.isStreaming) {
      this.abort();
    }

    this.abortController = new AbortController();
    this.isStreaming = true;

    try {
      const result = await streamReasoning(query, callbacks);
      return result;
    } finally {
      this.isStreaming = false;
      this.abortController = null;
    }
  }

  /**
   * Abort current stream
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isStreaming = false;
  }
}

/**
 * Create a reasoning stream for a visual explanation
 * Returns an async generator that yields chunks for UI display
 */
export async function* createReasoningStream(
  query: string
): AsyncGenerator<{ type: 'reasoning' | 'content' | 'done'; text: string }> {
  const client = createAnthropicClient();

  const enhancedPrompt = `The user asks: "${query}"

First, think through:
1. What exactly is being asked?
2. What's the user's likely background (kid, student, professional)?
3. What visual elements would best explain this?
4. What's the best way to structure the explanation?

Then provide a brief explanation.`;

  for await (const chunk of client.streamReasoning(enhancedPrompt, VISUAL_REASONING_PROMPT)) {
    yield { type: chunk.type, text: chunk.text };
  }
}

/**
 * Format reasoning text for display
 * Cleans up AI thinking markers and formats nicely
 */
export function formatReasoningText(text: string): string {
  return text
    .replace(/<think>/g, '')
    .replace(/<\/think>/g, '')
    .replace(/\*\*/g, '')
    .replace(/##/g, '')
    .trim();
}

/**
 * Extract key insights from reasoning
 */
export function extractReasoningInsights(reasoning: string): {
  audience: string | null;
  topic: string | null;
  visualElements: string[];
} {
  const audienceMatch = reasoning.match(/(?:user|audience|person|they).*?(?:kid|child|student|adult|professional|beginner|expert)/i);
  const topicMatch = reasoning.match(/(?:about|explaining|topic|subject).*?["']?(\w+(?:\s+\w+)?)/i);
  
  const visualElements: string[] = [];
  const visualMatches = reasoning.matchAll(/(?:show|display|draw|include|add).*?(?:a\s+)?(\w+(?:\s+\w+)?)/gi);
  for (const match of visualMatches) {
    if (match[1]) {
      visualElements.push(match[1].toLowerCase());
    }
  }

  return {
    audience: audienceMatch ? audienceMatch[0] : null,
    topic: topicMatch ? topicMatch[1] : null,
    visualElements: [...new Set(visualElements)].slice(0, 5)
  };
}

// Default export
export default {
  streamReasoning,
  createReasoningStream,
  formatReasoningText,
  extractReasoningInsights,
  ReasoningStreamManager
};

