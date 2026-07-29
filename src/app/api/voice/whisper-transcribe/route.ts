import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

/**
 * Whisper Transcription API
 * Transcribes audio using OpenAI Whisper model
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
    });

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
    });

  } catch (error) {
    logger.error('Whisper transcription error', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Whisper transcription API is running',
    model: 'whisper-1',
  });
}


