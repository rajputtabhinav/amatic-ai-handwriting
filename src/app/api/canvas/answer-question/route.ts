import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateAgenticResponse } from '@/lib/ai/agentic-service';
import { getUserByClerkId } from '@/lib/database/users';
import { chatRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { success, limit, remaining, reset } = await chatRateLimit.limit(`answer_${userId}`);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          limit,
          remaining,
          reset: reset instanceof Date ? reset.getTime() : reset,
        },
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

    const { question, domain } = await request.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Get user from database
    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate AI response
    const aiResponse = await generateAgenticResponse(
      question,
      [],
      domain || 'general'
    );

    return NextResponse.json({
      success: true,
      question: question,
      answer: aiResponse.content,
      model: aiResponse.model,
      provider: aiResponse.provider,
      tokensUsed: aiResponse.tokensUsed,
    });

  } catch (error) {
    console.error('Canvas answer API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate answer. Please check your API keys and try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Canvas Answer API is running',
    endpoints: {
      POST: '/api/canvas/answer-question - Get AI answer for canvas',
    },
    requiredParams: {
      question: 'string (required)',
      domain: 'string (optional)'
    },
    features: [
      'Detects text/questions from canvas',
      'Provides answers using OpenAI',
      'Returns formatted answer'
    ]
  });
}
