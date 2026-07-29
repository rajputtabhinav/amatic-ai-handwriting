import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

/**
 * OpenAI TTS API
 * 
 * DEPRECATED: This endpoint is deprecated in favor of ElevenLabs TTS
 * Use /api/voice/elevenlabs-tts for better quality voices
 * 
 * Kept for backward compatibility only
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1', // or 'tts-1-hd' for higher quality
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      speed: speed,
    });

    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Return audio file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    logger.error('OpenAI TTS error', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'OpenAI TTS API is running',
    model: 'tts-1',
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  });
}


