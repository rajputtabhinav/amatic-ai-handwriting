import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG } from '@/lib/ai/config';
import { createAnthropicClient } from '@/lib/api/anthropic-client';

/**
 * Simplified Chat API for Voice Conversations
 * Uses Anthropic Claude for all responses
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = AI_CONFIG.anthropic.apiKey;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Anthropic API key not configured' 
      }, { status: 500 });
    }

    // Generate AI response using Anthropic Claude
    const client = createAnthropicClient();
    
    const systemPrompt = `You are a helpful AI assistant. Explain concepts clearly and concisely. 
Use simple language, provide examples, and structure your explanations well. 
If relevant, mention key formulas or equations that should be highlighted.`;
    
    const aiResponse = await client.generateText(message, systemPrompt);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: AI_CONFIG.anthropic.model,
      provider: 'anthropic',
      tokensUsed: 0,
    });

  } catch (error) {
    console.error('Simple chat API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Simple Chat API is running',
    note: 'Using Anthropic Claude for all AI responses',
    model: AI_CONFIG.anthropic.model,
    provider: 'anthropic',
  });
}
