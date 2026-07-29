/**
 * Worker Route Generator Script
 * 
 * Generates 500 API route files for parallel visual generation.
 * Run with: npm run generate:workers
 * 
 * Creates: src/app/api/visual/worker-1/route.ts through worker-500/route.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const WORKER_COUNT = 500;
const API_BASE_PATH = path.join(process.cwd(), 'src', 'app', 'api', 'visual');

/**
 * Worker route template - IMAGE GENERATION ONLY
 */
const WORKER_TEMPLATE = `/**
 * Visual Worker API Route {{WORKER_ID}}
 * 
 * Generates IMAGES (PNG/JPG) from detailed Master AI brief.
 * Part of 500-worker parallel IMAGE generation system.
 * 
 * NO REACT COMPONENTS - Pure image generation using:
 * - Nano Banana (Google AI) - 85%
 * - Nano Banana Pro 3D - 10%
 * - DALL-E 3 (OpenAI) - 3%
 * - Flux 2 Pro (OpenRouter) - 2%
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterImageService } from '@/lib/image-generation/openrouter-image-service';
import { createDALLEClient } from '@/lib/image-generation/dalle-client';
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
    
    logger.info(\`[Worker-{{WORKER_ID}}] Task \${brief.taskId}: \${brief.concept} (Model: \${brief.selectedModel})\`);
    
    // Validate brief has image generation data
    if (!brief.imagePrompt || !brief.selectedModel) {
      throw new Error('Brief missing imagePrompt or selectedModel');
    }
    
    const startTime = Date.now();
    let imageUrl: string;
    let quality: number;
    let modelUsed: string;
    
    // Route to appropriate image generation service
    switch (brief.selectedModel) {
      case 'nano-banana': {
        // Nano Banana Standard (85%) - Google AI
        const googleClient = createGoogleAIClient();
        const result = await googleClient.generateStandard2D(brief.imagePrompt, {
          width: brief.technicalConstraints?.size?.width || 1024,
          height: brief.technicalConstraints?.size?.height || 1024,
        });
        imageUrl = result.url;
        quality = result.quality;
        modelUsed = result.model;
        break;
      }
      
      case 'nano-banana-pro': {
        // Nano Banana Pro 3D-Figurine (10%) - Google AI
        const googleClient = createGoogleAIClient();
        const result = await googleClient.generate3DFigurine(brief.imagePrompt, {
          width: brief.technicalConstraints?.size?.width || 1024,
          height: brief.technicalConstraints?.size?.height || 1024,
        });
        imageUrl = result.url;
        quality = result.quality;
        modelUsed = result.model;
        break;
      }
      
      case 'dall-e-3': {
        // DALL-E 3 Hero Images (3%) - OpenAI
        const dalleClient = createDALLEClient();
        const result = await dalleClient.generateHeroImage(brief.imagePrompt, {
          size: '1024x1024',
          quality: 'hd',
          style: 'natural'
        });
        imageUrl = result.url;
        quality = result.quality;
        modelUsed = result.model;
        break;
      }
      
      case 'gpt-5-image-mini': 
      case 'flux-2-pro': 
      default: {
        // Flux 2 Pro or GPT-5 Image (2%) - via OpenRouter
        const imageService = createOpenRouterImageService();
        const visualType = brief.visualType || '2d-standard';
        const result = await imageService.generateWithBestModel(
          brief.imagePrompt,
          visualType,
          {
            width: brief.technicalConstraints?.size?.width || 1024,
            height: brief.technicalConstraints?.size?.height || 1024,
          }
        );
        imageUrl = result.url;
        quality = result.quality;
        modelUsed = result.model;
        break;
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    logger.info(\`[Worker-{{WORKER_ID}}] ✅ Image generated! Quality: \${quality}/100, Time: \${totalTime}ms\`);
    
    // Return IMAGE URL (NOT React code!)
    return NextResponse.json({
      workerId: {{WORKER_ID}},
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
    logger.error(\`[Worker-{{WORKER_ID}}] ❌ Error:\`, error);
    
    return NextResponse.json({
      workerId: {{WORKER_ID}},
      status: 'error',
      error: error instanceof Error ? error.message : 'Image generation failed'
    }, { status: 500 });
  }
}
`;

/**
 * Generate all worker routes
 */
function generateWorkerRoutes(): void {
  console.log(`Generating ${WORKER_COUNT} worker routes...`);
  
  let successCount = 0;
  let skipCount = 0;
  
  for (let i = 1; i <= WORKER_COUNT; i++) {
    const workerDir = path.join(API_BASE_PATH, `worker-${i}`);
    const routeFile = path.join(workerDir, 'route.ts');
    
    // Skip if already exists
    if (fs.existsSync(routeFile)) {
      skipCount++;
      continue;
    }
    
    // Create directory
    if (!fs.existsSync(workerDir)) {
      fs.mkdirSync(workerDir, { recursive: true });
    }
    
    // Generate route file from template
    const routeContent = WORKER_TEMPLATE.replace(/{{WORKER_ID}}/g, i.toString());
    
    // Write file
    fs.writeFileSync(routeFile, routeContent, 'utf8');
    successCount++;
    
    if (i % 50 === 0) {
      console.log(`  Generated ${i}/${WORKER_COUNT} routes...`);
    }
  }
  
  console.log(`\n✅ Worker route generation complete!`);
  console.log(`   Created: ${successCount} new routes`);
  console.log(`   Skipped: ${skipCount} existing routes`);
  console.log(`   Total: ${WORKER_COUNT} workers ready\n`);
}

/**
 * Clean up worker routes (for development)
 */
function cleanWorkerRoutes(): void {
  console.log(`Cleaning up worker routes...`);
  
  let cleanedCount = 0;
  
  for (let i = 1; i <= WORKER_COUNT; i++) {
    const workerDir = path.join(API_BASE_PATH, `worker-${i}`);
    
    if (fs.existsSync(workerDir)) {
      fs.rmSync(workerDir, { recursive: true, force: true });
      cleanedCount++;
    }
  }
  
  console.log(`✅ Cleaned ${cleanedCount} worker routes\n`);
}

/**
 * Main execution
 */
function main(): void {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    cleanWorkerRoutes();
    return;
  }
  
  if (args.includes('--help')) {
    console.log(`
Worker Route Generator

Usage:
  npm run generate:workers           Generate 500 worker routes
  npm run generate:workers --clean   Remove all worker routes
  npm run generate:workers --help    Show this help

Generated routes:
  src/app/api/visual/worker-1/route.ts
  src/app/api/visual/worker-2/route.ts
  ...
  src/app/api/visual/worker-500/route.ts
`);
    return;
  }
  
  generateWorkerRoutes();
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { generateWorkerRoutes, cleanWorkerRoutes };

