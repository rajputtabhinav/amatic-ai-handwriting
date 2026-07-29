/**
 * Reasoning Stream API
 * 
 * Streams AI reasoning/thinking in real-time.
 * Uses DeepSeek R1 via OpenRouter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAnthropicClient } from '@/lib/api/anthropic-client';
import { reasoningRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting (R1 is expensive)
    const { success, limit, remaining, reset } = await reasoningRateLimit.limit(userId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', limit, remaining },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': (reset instanceof Date ? reset.getTime() : reset).toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { query, systemPrompt } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const client = createAnthropicClient();

    // Create a readable stream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of client.streamReasoning(query, systemPrompt)) {
            const data = JSON.stringify(chunk) + '\n';
            controller.enqueue(encoder.encode(`data: ${data}\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', text: errorMessage })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Reasoning stream error:', error);
    return NextResponse.json(
      { error: 'Failed to stream reasoning' },
      { status: 500 }
    );
  }
}

