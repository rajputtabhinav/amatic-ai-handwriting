/**
 * Analyze Query API
 * 
 * Server-side query analysis for audience, emotion, and style detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeQueryLocally, analyzeQueryWithAI } from '@/lib/visual/query-analyzer';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - local analysis works without auth)
    const { userId } = await auth();

    const body = await request.json();
    const { query, useAI = false } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Use AI analysis only for authenticated users with API key
    let analysis;
    
    if (userId && useAI && process.env.OPENROUTER_API_KEY) {
      try {
        analysis = await analyzeQueryWithAI(query);
      } catch (error) {
        console.warn('AI analysis failed, using local:', error);
        analysis = analyzeQueryLocally(query);
      }
    } else {
      // Local analysis works for everyone (fast, no API needed)
      analysis = analyzeQueryLocally(query);
    }

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Query analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to analyze query', details: errorMessage },
      { status: 500 }
    );
  }
}

