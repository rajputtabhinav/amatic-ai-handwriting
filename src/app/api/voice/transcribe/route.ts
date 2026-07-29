import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert blob to File for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create File object directly
    const file = new File([buffer], `audio-${Date.now()}.wav`, { 
      type: 'audio/wav' 
    });

    try {
      // Use OpenAI Whisper for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: file as any,
        model: 'whisper-1',
        language: 'en', // Auto-detect or specify language
        response_format: 'json'
      });

      return NextResponse.json({ 
        text: transcription.text,
        success: true 
      });

    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

