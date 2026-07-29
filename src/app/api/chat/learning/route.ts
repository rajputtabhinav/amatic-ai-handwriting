import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAgenticResponse } from '@/lib/ai/agentic-service';
import { getUserByClerkId } from '@/lib/database/users';
import { chatRateLimit } from '@/lib/rate-limit';

// Canvas element type for context
interface CanvasContextElement {
  type: string;
  text?: string;
  [key: string]: unknown;
}

// Helper to extract text from different file types
async function processFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return await file.text();
    }
    
    if (fileType === 'application/pdf') {
      return `[PDF Document: ${file.name}]\nNote: PDF text extraction will be implemented with pdf-parse library.`;
    }
    
    if (fileType.startsWith('image/')) {
      return `[Image: ${file.name}]\nNote: Image analysis capability enabled.`;
    }
    
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || 
        fileName.endsWith('.py') || fileName.endsWith('.java') ||
        fileName.endsWith('.cpp') || fileName.endsWith('.c')) {
      const code = await file.text();
      return `[Code File: ${file.name}]\n\`\`\`\n${code}\n\`\`\``;
    }

    return `[File: ${file.name}]\nUnsupported file type for text extraction.`;
  } catch (error) {
    console.error('Error processing file:', error);
    return `[Error processing file: ${file.name}]`;
  }
}

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

    const formData = await request.formData();
    const message = formData.get('message') as string;
    const canvasContextStr = formData.get('canvasContext') as string;
    const domain = formData.get('domain') as string || 'general';
    const files = formData.getAll('files') as File[];

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let canvasContext = [];
    try {
      if (canvasContextStr) {
        canvasContext = JSON.parse(canvasContextStr);
      }
    } catch (e) {
      console.error('Error parsing canvas context:', e);
    }

    // Process uploaded files
    let fileContents = '';
    if (files.length > 0) {
      fileContents = '\n\n**Uploaded Files:**\n';
      for (const file of files) {
        const content = await processFile(file);
        fileContents += `\n${content}\n`;
      }
    }

    // Get user from database (optional - for tracking/analytics)
    try {
      await getUserByClerkId(userId);
    } catch (dbError) {
      console.warn('Database not available, continuing without user data:', dbError);
    }

    // Build full message with context
    const fullMessage = message + fileContents;
    
    // Add canvas context as additional context in the message
    let contextualMessage = fullMessage;
    if (canvasContext && canvasContext.length > 0) {
      const typedContext = canvasContext as CanvasContextElement[];
      const textElements = typedContext.filter((el) => el.type === 'text' && el.text);
      if (textElements.length > 0) {
        contextualMessage = `[Canvas Context: User has written "${textElements.map((el) => el.text).join(' ')}" on canvas]\n\n${fullMessage}`;
      }
    }

    // Generate AI response
    const aiResponse = await generateAgenticResponse(
      contextualMessage,
      [],
      domain
    );

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      model: aiResponse.model,
      provider: aiResponse.provider,
      tokensUsed: aiResponse.tokensUsed,
      visualSuggestions: aiResponse.visualSuggestions
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate response. Please check your API keys and try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Chat API is running',
    endpoints: {
      POST: '/api/chat/learning - AI assistant with canvas integration',
    },
    requiredParams: {
      message: 'string (required)',
      canvasContext: 'JSON string (optional)',
      domain: 'string (optional)',
      files: 'File[] (optional)'
    },
    features: [
      'Context-aware AI responses',
      'File attachment support',
      'Canvas element awareness',
      'Rate limiting',
      'Voice synthesis ready'
    ]
  });
}
