/**
 * Generate Timeline API
 * 
 * Creates animated scene scripts with voice cues.
 * Synchronizes visual animations with voice narration.
 * Works for all users (authenticated and unauthenticated).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateTimeline } from '@/lib/visual/timeline-generator';
import { SVGElementData } from '@/lib/api/anthropic-client';
import { visualAIRateLimit } from '@/lib/rate-limit';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - AI works for everyone)
    const { userId } = await auth();

    const body = await request.json();
    const { 
      query, 
      elements,
      duration = 15,
      sceneCount = 5,
      voiceStyle = 'professional',
      pacing = 'normal'
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Rate limiting for authenticated users only
    if (userId) {
      const { success, limit, remaining, reset } = await visualAIRateLimit.limit(userId);
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
    }

    // Parse elements if provided as string
    let parsedElements: SVGElementData[] = [];
    if (elements) {
      if (typeof elements === 'string') {
        try {
          parsedElements = JSON.parse(elements);
        } catch {
          parsedElements = [];
        }
      } else if (Array.isArray(elements)) {
        parsedElements = elements;
      }
    }

    // Generate timeline with AI
    const timeline = await generateTimeline(query, parsedElements, {
      duration,
      sceneCount,
      voiceStyle,
      pacing
    });

    return NextResponse.json({
      success: true,
      timeline: {
        title: timeline.title,
        duration: timeline.duration,
        scenes: timeline.scenes
      },
      totalVoiceDuration: timeline.totalVoiceDuration,
      metadata: timeline.metadata
    });
  } catch (error) {
    console.error('Timeline generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to generate timeline', details: errorMessage },
      { status: 500 }
    );
  }
}

