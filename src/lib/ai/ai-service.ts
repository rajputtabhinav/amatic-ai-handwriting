import { ChatMessage, AIResponse } from './config';
import { generateAnthropicResponse } from './anthropic-service';
import { generateFallbackResponse } from './fallback-service';

export async function generateAIResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<AIResponse> {
  return generateAnthropicResponse(messages, systemPrompt);
}

export async function generateResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    return await generateAIResponse(messages);
  } catch {
    // Use fallback service if Anthropic fails
    console.warn('Anthropic failed, using fallback service');
    return await generateFallbackResponse(messages);
  }
}
