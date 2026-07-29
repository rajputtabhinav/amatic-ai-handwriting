/**
 * Visual Worker Template Route
 * 
 * Template for all 500 worker routes - IMAGE GENERATION ONLY
 * Each worker receives a DetailedWorkerBrief and generates a REAL IMAGE (PNG/JPG)
 * 
 * SIMPLIFIED: Uses ONLY Google Gemini 2.5 Flash for all 2D images
 * - Single API key (Google AI / Gemini)
 * - Consistent quality across all workers
 * - Fast and reliable generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAIClient } from '@/lib/image-generation/google-ai-client';
import type { DetailedWorkerBrief } from '@/types/master-plan';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const maxDuration = 60;  // Longer timeout for image generation

// TEMPLATE_WORKER_ID - Replace with actual worker ID when generating workers
const WORKER_ID = 0;

/**
 * Generate IMAGE from detailed brief using Google Gemini
 * Returns IMAGE URL (PNG/JPG), NOT React code!
 */
export async function POST(request: NextRequest) {
  try {
    const brief: DetailedWorkerBrief = await request.json();
    
    logger.info(`[Worker-${WORKER_ID}] Task ${brief.taskId}: ${brief.concept} (Model: Gemini 2.5 Flash)`);
    
    // Validate brief has image generation data
    if (!brief.imagePrompt) {
      throw new Error('Brief missing imagePrompt');
    }
    
    const startTime = Date.now();
    
    // SIMPLIFIED: Always use Google Gemini client
    const googleClient = createGoogleAIClient();
    
    logger.info(`[Worker-${WORKER_ID}] Generating image with Gemini 2.5 Flash...`);
    
    const result = await googleClient.generateImage(brief.imagePrompt, {
      width: brief.technicalConstraints?.size?.width || 1024,
      height: brief.technicalConstraints?.size?.height || 1024,
    });
    
    const imageUrl = result.url;
    const quality = result.quality;
    const modelUsed = result.model;
    const totalTime = Date.now() - startTime;
    
    logger.info(`[Worker-${WORKER_ID}] ✅ Success! Quality: ${quality}/100, Time: ${totalTime}ms`);
    
    // Return IMAGE URL (not React code!)
    return NextResponse.json({
      workerId: WORKER_ID,
      taskId: brief.taskId,
      type: '2d-image',
      imageUrl,
      quality,
      model: modelUsed,
      generationTime: totalTime,
      status: 'success',
      concept: brief.concept
    });
    
  } catch (error) {
    logger.error(`[Worker-${WORKER_ID}] ❌ Error:`, error);
    
    return NextResponse.json({
      workerId: WORKER_ID,
      status: 'error',
      error: error instanceof Error ? error.message : 'Image generation failed'
    }, { status: 500 });
  }
}
