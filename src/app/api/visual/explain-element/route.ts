/**
 * Explain Element API
 * 
 * Streaming endpoint that explains a canvas element
 * when user asks "What is this?" via voice command.
 */

import { NextRequest } from 'next/server';
import { createAnthropicClient } from '@/lib/api/anthropic-client';

export const runtime = 'edge';
export const maxDuration = 30;

interface ElementInfo {
  type: string;
  description: string;
  properties: Record<string, unknown>;
  nearbyElements?: { type: string; distance: number }[];
  userQuery?: string;
}

/**
 * Build educational prompt for element explanation
 */
function buildExplanationPrompt(elementInfo: ElementInfo): string {
  const parts: string[] = [];
  
  parts.push('You are an educational AI assistant helping someone learn.');
  parts.push('The user is pointing at an element on a visual learning canvas and asked a question.');
  parts.push('Provide a helpful, educational explanation that is conversational and easy to understand.');
  parts.push('Keep your response concise (2-4 sentences) unless more detail is needed.');
  parts.push('If the element is part of a larger concept being visualized, explain how it fits in.');
  parts.push('');
  parts.push('Element Information:');
  parts.push(`- Type: ${elementInfo.type}`);
  parts.push(`- Description: ${elementInfo.description}`);
  
  if (elementInfo.properties.text) {
    parts.push(`- Content: "${elementInfo.properties.text}"`);
  }
  
  if (elementInfo.properties.isAIGenerated) {
    parts.push('- This is an AI-generated educational visual');
  }
  
  if (elementInfo.nearbyElements && elementInfo.nearbyElements.length > 0) {
    const nearby = elementInfo.nearbyElements
      .slice(0, 3)
      .map(n => n.type)
      .join(', ');
    parts.push(`- Nearby elements: ${nearby}`);
  }
  
  parts.push('');
  
  if (elementInfo.userQuery) {
    parts.push(`User's question: "${elementInfo.userQuery}"`);
  } else {
    parts.push('User asked: "What is this?"');
  }
  
  parts.push('');
  parts.push('Respond naturally as if you\'re a helpful teacher. Start directly with the explanation.');
  
  return parts.join('\n');
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const body = await request.json();
    const { elementInfo, userQuery } = body as { 
      elementInfo: ElementInfo; 
      userQuery?: string;
    };
    
    if (!elementInfo) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ type: 'error', text: 'Element info required' })}\n\n`),
        { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }
    
    // Add user query to element info
    if (userQuery) {
      elementInfo.userQuery = userQuery;
    }
    
    const client = createAnthropicClient();
    const prompt = buildExplanationPrompt(elementInfo);
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
          );
          
          let fullResponse = '';
          
          // Stream the explanation
          for await (const chunk of client.streamReasoning(prompt)) {
            if (chunk.type === 'content' && chunk.text) {
              fullResponse += chunk.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'content', 
                  text: chunk.text 
                })}\n\n`)
              );
            }
          }
          
          // Send completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done',
              fullText: fullResponse,
            })}\n\n`)
          );
          
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', text: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ type: 'error', text: errorMessage })}\n\n`),
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }
}

