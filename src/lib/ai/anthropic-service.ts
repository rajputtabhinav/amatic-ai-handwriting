/**
 * Anthropic Service for Chat
 * 
 * Direct Anthropic API service replacing OpenRouter
 * Uses Claude Sonnet 4 for all AI operations
 */

import { AI_CONFIG, ChatMessage, AIResponse } from './config';
import { createAnthropicClient } from '@/lib/api/anthropic-client';

/**
 * Generate AI response using Anthropic Claude Sonnet 4
 * Direct replacement for generateOpenRouterResponse
 */
export async function generateAnthropicResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<AIResponse> {
  const apiKey = AI_CONFIG.anthropic.apiKey;
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const defaultSystemPrompt = `You are a versatile AI assistant powered by Amatic.ai. You help users with any task including:

1. Software development and coding
2. Business strategy and analysis
3. Creative writing and content creation
4. Data analysis and research
5. Problem-solving and brainstorming
6. Technical documentation
7. Project planning and management

Provide clear, actionable responses tailored to the user's needs. Be helpful, professional, and thorough in your explanations.`;

  try {
    const client = createAnthropicClient();
    
    // Build prompt from conversation history
    let conversationContext = '';
    for (const msg of messages) {
      if (msg.role === 'system') continue; // System prompt handled separately
      conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    }
    
    // Generate response
    const content = await client.generateText(
      conversationContext,
      systemPrompt || defaultSystemPrompt
    );

    return {
      content,
      model: AI_CONFIG.anthropic.model,
      provider: 'anthropic',
      tokensUsed: undefined, // Anthropic SDK doesn't expose token count in non-streaming mode
    };
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw new Error('Failed to generate response from Anthropic');
  }
}

/**
 * Stream AI response using Anthropic Claude Sonnet 4
 * Returns streaming content
 */
export async function* streamAnthropicResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): AsyncGenerator<{ type: 'reasoning' | 'content' | 'done'; text: string }> {
  const apiKey = AI_CONFIG.anthropic.apiKey;
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const defaultSystemPrompt = `You are a versatile AI assistant powered by Amatic.ai. Provide clear, helpful responses.`;

  try {
    const client = createAnthropicClient();
    
    // Build prompt from conversation history
    let conversationContext = '';
    for (const msg of messages) {
      if (msg.role === 'system') continue;
      conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    }
    
    // Stream response
    for await (const chunk of client.streamReasoning(
      conversationContext,
      systemPrompt || defaultSystemPrompt
    )) {
      yield chunk;
    }
  } catch (error) {
    console.error('Anthropic streaming error:', error);
    throw error;
  }
}

// Export for backward compatibility (same interface as openrouter-service)
export { generateAnthropicResponse as generateOpenRouterResponse };
export { streamAnthropicResponse as streamOpenRouterResponse };
