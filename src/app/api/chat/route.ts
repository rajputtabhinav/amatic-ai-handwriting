import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateAgenticResponse } from '@/lib/ai/agentic-service';
import { generateFallbackResponse } from '@/lib/ai/fallback-service';
import { ChatMessage } from '@/lib/ai/config';
import { logChatUsage, checkUsageLimits } from '@/lib/database/usage-logging';
import { getUserByClerkId } from '@/lib/database/users';
import { chatRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const identifier = userId;
    const { success, limit, remaining, reset } = await chatRateLimit.limit(identifier);
    
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

    // Handle both JSON and FormData requests
    const contentType = request.headers.get('content-type') || '';
    let message: string;
    let conversationHistory: ChatMessage[] | undefined;
    let domain: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (from ai-chat.tsx with file attachments)
      const formData = await request.formData();
      message = formData.get('message') as string;
      const canvasContext = formData.get('canvasContext') as string;
      const modelKey = formData.get('modelKey') as string;
      
      // Parse canvas context if provided
      if (canvasContext) {
        try {
          JSON.parse(canvasContext); // Validate JSON but don't use it directly
        } catch {
          // Ignore invalid canvas context
        }
      }
      
      // Use modelKey as domain hint if provided
      domain = modelKey || 'general';
      conversationHistory = [];
    } else {
      // Handle JSON request
      const body = await request.json();
      message = body.message;
      conversationHistory = body.conversationHistory;
      domain = body.domain;
    }
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user from database
    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits
    const usageCheck = await checkUsageLimits(user.id, 'chat');
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded', 
        current: usageCheck.current,
        limit: usageCheck.limit,
        plan: usageCheck.plan
      }, { status: 429 });
    }

    // Convert conversation history to proper format
    const history: ChatMessage[] = conversationHistory || [];

    // Generate AI response - use fallback if APIs not configured
    let aiResponse;
    try {
      aiResponse = await generateAgenticResponse(
        message,
        history,
        domain || 'general'
      );
    } catch {
      logger.warn('AI APIs not available, using fallback service');
      aiResponse = await generateFallbackResponse([...history, { role: 'user', content: message }]);
    }

    // Log usage to database for tracking
    await logChatUsage({
      userId: user.id,
      userMessage: message,
      aiResponse: aiResponse.content,
      provider: aiResponse.provider,
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed
    });

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      model: aiResponse.model,
      provider: aiResponse.provider,
      tokensUsed: aiResponse.tokensUsed,
      visualSuggestions: aiResponse.visualSuggestions || [],
    });

  } catch (error) {
    logger.error('Chat API error', error);
    
    // Return a helpful fallback response
    return NextResponse.json({
      success: true,
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment. I'm here to help with coding, business, creative projects, research, and much more!",
      model: 'fallback',
      provider: 'system',
      tokensUsed: 0,
    });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Chat API is running',
    supportedProviders: ['openrouter'],
    model: 'deepseek/deepseek-r1',
    features: [
      'Software development assistance',
      'Business strategy and analysis',
      'Creative writing and content',
      'Data analysis and research',
      'Problem-solving and brainstorming',
      'General-purpose assistance'
    ]
  });
}
