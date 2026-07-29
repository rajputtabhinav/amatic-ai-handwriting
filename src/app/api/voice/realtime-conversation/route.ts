import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateVisuals } from '@/lib/ai/auto-visual-generator';

/**
 * Real-time Conversation API
 * Handles voice conversation with automatic visual generation
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, canvasContext } = await request.json();
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Get AI response using existing chat API logic
    const aiResponse = await generateAIResponse(transcript, canvasContext);
    
    // Generate visuals in parallel
    const visuals = await generateVisuals(aiResponse, transcript);
    
    // Generate voice using ElevenLabs (your existing integration)
    const audioUrl = await generateVoiceResponse(aiResponse);

    return NextResponse.json({
      success: true,
      transcript,
      aiResponse,
      audioUrl,
      visuals: {
        images: visuals.images,
        formulas: visuals.formulas
      }
    });

  } catch (error) {
    console.error('Real-time conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    );
  }
}

/**
 * Generate AI response using OpenRouter/DeepSeek R1
 */
async function generateAIResponse(userMessage: string, context?: string[]): Promise<string> {
  try {
    // Call your existing AI service (now uses OpenRouter/DeepSeek R1)
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: context || [],
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return data.response || 'I apologize, I could not generate a response.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I apologize, I encountered an error. Please try again.';
  }
}

/**
 * Generate voice response using ElevenLabs (your existing integration)
 */
async function generateVoiceResponse(text: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId: 'default',
        settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          speed: 1.0
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to synthesize voice');
    }

    const audioBlob = await response.blob();
    // In production, you'd upload this to cloud storage
    // For now, return a data URL
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error generating voice:', error);
    return '';
  }
}

// GET endpoint for status check
export async function GET() {
  return NextResponse.json({
    status: 'Real-time conversation API is running',
    features: ['Voice conversation', 'Auto visuals', 'ElevenLabs TTS']
  });
}

