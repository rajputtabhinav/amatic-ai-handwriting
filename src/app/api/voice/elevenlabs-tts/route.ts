import { NextRequest, NextResponse } from 'next/server';
import { createElevenLabsClient } from '@/lib/voice/elevenlabs-client';
import { logger } from '@/lib/logger';

/**
 * ElevenLabs TTS API
 * Converts text to speech using ElevenLabs premium voices
 * Replaces OpenAI TTS with higher quality voice synthesis
 */

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id, model_id, voice_settings } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const client = createElevenLabsClient();

    if (!client.isAvailable) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    logger.info(`[ElevenLabs] Generating speech: ${text.substring(0, 50)}...`);

    // Generate speech using ElevenLabs
    const result = await client.textToSpeech({
      text,
      voice_id: voice_id || 'EXAVITQu4vr4xnSDxMaL', // Default: Bella
      model_id: model_id || 'eleven_multilingual_v2',
      voice_settings: voice_settings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    });

    // Return audio file (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': result.audio.length.toString(),
        'X-Voice-ID': result.voice_id,
        'X-Model-ID': result.model_id,
      },
    });

  } catch (error) {
    logger.error('[ElevenLabs] TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const client = createElevenLabsClient();
  
  return NextResponse.json({
    status: 'ElevenLabs TTS API is running',
    available: client.isAvailable,
    model: 'eleven_multilingual_v2',
    defaultVoice: 'EXAVITQu4vr4xnSDxMaL',
    note: 'Premium voice synthesis with 40+ voices',
  });
}
