/**
 * OpenRouter Service for Chat
 * 
 * DEPRECATED: Replaced by Anthropic SDK
 * Use src/lib/api/anthropic-client.ts instead
 * 
 * Kept for backward compatibility only
 */

import { AI_CONFIG, ChatMessage, AIResponse } from './config';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate AI response using OpenRouter/DeepSeek R1
 */
export async function generateOpenRouterResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<AIResponse> {
  const apiKey = AI_CONFIG.openrouter.apiKey;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
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

  const openRouterMessages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt || defaultSystemPrompt },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
  ];

  try {
    const response = await fetch(`${AI_CONFIG.openrouter.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://amatic.ai',
        'X-Title': 'Amatic AI Assistant'
      },
      body: JSON.stringify({
        model: AI_CONFIG.openrouter.model,
        messages: openRouterMessages,
        max_tokens: AI_CONFIG.openrouter.maxTokens,
        temperature: AI_CONFIG.openrouter.temperature,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    const content = data.choices[0]?.message?.content;
    const reasoning = data.choices[0]?.message?.reasoning_content;
    
    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    // Clean up thinking tags if present in content
    const cleanContent = content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    return {
      content: cleanContent,
      model: AI_CONFIG.openrouter.model,
      provider: 'openrouter',
      tokensUsed: data.usage?.total_tokens,
      reasoning: reasoning || undefined,
    };
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error('Failed to generate response from OpenRouter');
  }
}

/**
 * Stream AI response using OpenRouter/DeepSeek R1
 * Returns both reasoning/thinking and final content
 */
export async function* streamOpenRouterResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): AsyncGenerator<{ type: 'reasoning' | 'content' | 'done'; text: string }> {
  const apiKey = AI_CONFIG.openrouter.apiKey;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const defaultSystemPrompt = `You are a versatile AI assistant powered by Amatic.ai. Provide clear, helpful responses.`;

  const openRouterMessages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt || defaultSystemPrompt },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
  ];

  const response = await fetch(`${AI_CONFIG.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://amatic.ai',
      'X-Title': 'Amatic AI Assistant'
    },
    body: JSON.stringify({
      model: AI_CONFIG.openrouter.model,
      messages: openRouterMessages,
      max_tokens: AI_CONFIG.openrouter.maxTokens,
      temperature: AI_CONFIG.openrouter.temperature,
      stream: true,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let isInThinking = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done', text: '' };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            const reasoning = parsed.choices?.[0]?.delta?.reasoning_content || '';

            // Handle reasoning/thinking content
            if (reasoning) {
              yield { type: 'reasoning', text: reasoning };
            }

            // Handle regular content
            if (content) {
              // Detect thinking markers
              if (content.includes('<think>')) {
                isInThinking = true;
              }
              if (content.includes('</think>')) {
                isInThinking = false;
              }

              const cleanContent = content.replace(/<\/?think>/g, '');
              if (cleanContent) {
                yield { 
                  type: isInThinking ? 'reasoning' : 'content', 
                  text: cleanContent
                };
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

