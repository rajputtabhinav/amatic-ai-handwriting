/**
 * OpenAI Service - DEPRECATED
 * This file is kept for backwards compatibility.
 * All AI requests now go through Anthropic Claude.
 * Use anthropic-service.ts instead.
 */

import { ChatMessage, AIResponse } from './config';
import { generateAnthropicResponse } from './anthropic-service';

/**
 * @deprecated Use generateAnthropicResponse from anthropic-service.ts instead
 */
export async function generateOpenAIResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<AIResponse> {
  // Redirect to Anthropic service
  return generateAnthropicResponse(messages, systemPrompt);
}
