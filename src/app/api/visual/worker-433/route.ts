/**
 * Visual Worker API Route 433
 * 
 * Generates IMAGES (PNG/JPG) from detailed Master AI brief.
 * Part of 500-worker parallel IMAGE generation system.
 * 
 * SIMPLIFIED: Uses ONLY Google Gemini 2.5 Flash for all 2D images
 * - Single API key (Google AI / Gemini)
 * - Consistent quality
 * - Fast and reliable
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAIClient } from '@/lib/image-generation/google-ai-client';
import type { DetailedWorkerBrief } from '@/types/master-plan';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const maxDuration = 60;  // Longer for image generation

/**
 * Generate IMAGE from detailed brief
 * Returns IMAGE URL, NOT React code!
 */
export async function POST(request: NextRequest) {
  try {
    const brief: DetailedWorkerBrief = await request.json();
    
    logger.info(`[Worker-433] Task ${brief.taskId}: ${brief.concept} (Model: ${brief.selectedModel})`);
    
    // Validate brief has image generation data
    if (!brief.imagePrompt || !brief.selectedModel) {
      throw new Error('Brief missing imagePrompt or selectedModel');
    }
    
    const startTime = Date.now();
    let imageUrl: string;
    let quality: number;
    let modelUsed: string;
    
    // SIMPLIFIED: Always use Google Gemini client
    const googleClient = createGoogleAIClient();
    
    // Determine if we need 3D-style or standard generation
    const is3DStyle = brief.selectedModel?.includes('3d') || brief.visualType === '3d-style-2d';
    
    const result = is3DStyle 
      ? await googleClient.generate3DStyle(brief.imagePrompt, {
          width: brief.technicalConstraints?.size?.width || 1024,
          height: brief.technicalConstraints?.size?.height || 1024,
        })
      : await googleClient.generateStandard2D(brief.imagePrompt, {
          width: brief.technicalConstraints?.size?.width || 1024,
          height: brief.technicalConstraints?.size?.height || 1024,
        });
    
    imageUrl = result.url;
    quality = result.quality;
    modelUsed = result.model;
    
    const totalTime = Date.now() - startTime;
    
    logger.info(`[Worker-433] ✅ Image generated! Quality: ${quality}/100, Time: ${totalTime}ms`);
    
    // Return IMAGE URL (NOT React code!)
    return NextResponse.json({
      workerId: 433,
      taskId: brief.taskId,
      type: brief.visualType === 'true-3d' ? '3d-model' : '2d-image',
      imageUrl,  // ← ACTUAL IMAGE URL
      quality,
      model: modelUsed,
      generationTime: totalTime,
      status: 'success',
      concept: brief.concept
    });
    
  } catch (error) {
    logger.error(`[Worker-433] ❌ Error:`, error);
    
    return NextResponse.json({
      workerId: 433,
      status: 'error',
      error: error instanceof Error ? error.message : 'Image generation failed'
    }, { status: 500 });
  }
}
