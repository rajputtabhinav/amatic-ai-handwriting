/**
 * Master Orchestration API Route
 * 
 * Central intelligence hub that coordinates the entire multi-AI system:
 * 1. Master AI creates plan with detailed briefs
 * 2. Delegates to 500 workers in parallel
 * 3. Generates text overlay and voice narration
 * 4. Streams everything to client progressively
 * 
 * This is the main entry point replacing single-visual generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createMasterPlanner } from '@/lib/ai/master-planner';
import { createWorkerCoordinator } from '@/lib/workers/worker-coordinator';
import { createWorkerStatusTracker } from '@/lib/workers/worker-status-tracker';
import { EmotionVoiceService } from '@/lib/voice/emotion-voice';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const maxDuration = 300;  // 5 minutes for complex queries

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const { userId: _userId } = await auth();
    const { query, maxVisuals } = await request.json();
    
    if (!query) {
      return new Response(
        encoder.encode(JSON.stringify({ type: 'error', message: 'Query required' })),
        { status: 400 }
      );
    }
    
    logger.info(`[Orchestrator] Starting multi-visual generation for: "${query}"`);
    
    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const startTime = Date.now();
          
          // === PHASE 1: MASTER AI PLANNING ===
          logger.info(`[Orchestrator] Master AI analyzing query: "${query}"`);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'status', 
              phase: 'planning',
              message: 'Analyzing your query...' 
            })}\n\n`)
          );
          
          // Stream Master AI reasoning to Dynamic Island
          const masterPlanner = createMasterPlanner();
          
          // Create plan and stream reasoning steps
          const plan = await masterPlanner.createMasterPlan(query, {
            maxVisuals: maxVisuals || 500,
            useAIClassification: true,
            // Callback to stream reasoning to client
            onReasoning: (reasoning: string) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'reasoning',
                  text: reasoning
                })}\n\n`)
              );
            }
          });
          
          const planningTime = Date.now() - startTime;
          logger.info(`[Orchestrator] Planning complete in ${planningTime}ms`);
          logger.info(`[Orchestrator] Plan: ${plan.totalVisuals} visuals, ${Math.round(plan.textRatio * 100)}% text, ${Math.round(plan.estimatedDuration)}s voice`);
          
          // Send plan to client
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'plan',
              data: {
                totalVisuals: plan.totalVisuals,
                textRatio: plan.textRatio,
                estimatedDuration: plan.estimatedDuration,
                contentType: plan.contentType,
                layoutStrategy: plan.layout.strategy
              }
            })}\n\n`)
          );
          
          // === PHASE 2: PARALLEL WORKER DELEGATION ===
          logger.info(`[Orchestrator] Phase 2: Delegating to ${plan.workerBriefs.length} workers...`);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              phase: 'generating',
              message: `Generating ${plan.totalVisuals} visuals...`
            })}\n\n`)
          );
          
          const coordinator = createWorkerCoordinator({
            maxParallelWorkers: 500,
            retryFailedTasks: true
          });
          
          const statusTracker = createWorkerStatusTracker();
          statusTracker.initialize(plan.workerBriefs.map(b => b.taskId));
          
          let completedCount = 0;
          
          // Stream visual results as workers complete
          for await (const visual of coordinator.delegateToWorkers(plan.workerBriefs)) {
            completedCount++;
            
            if (visual.status === 'success') {
              // Send visual to client (now sends imageUrl instead of component)
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'visual',
                  data: {
                    taskId: visual.taskId,
                    imageUrl: visual.imageUrl,      // Image URL for display
                    modelUrl: visual.modelUrl,      // 3D model URL if applicable
                    type: visual.type,              // '2d-image' or '3d-model'
                    position: visual.position,
                    size: visual.size,
                    quality: visual.quality,
                    model: visual.model
                  }
                })}\n\n`)
              );
              
              // Send progress update every 5 visuals
              if (completedCount % 5 === 0 || completedCount === plan.totalVisuals) {
                const _progress = statusTracker.getProgress();
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'progress',
                    data: {
                      completed: completedCount,
                      total: plan.totalVisuals,
                      percentage: Math.round((completedCount / plan.totalVisuals) * 100)
                    }
                  })}\n\n`)
                );
              }
            } else {
              logger.warn(`[Orchestrator] Visual ${visual.taskId} failed: ${visual.error}`);
            }
          }
          
          const generationTime = Date.now() - startTime;
          logger.info(`[Orchestrator] Visual generation complete in ${generationTime}ms`);
          
          // === PHASE 3: TEXT OVERLAY ===
          logger.info(`[Orchestrator] Phase 3: Sending ${plan.textElements.length} text elements...`);
          
          for (const textElement of plan.textElements) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'text',
                data: textElement
              })}\n\n`)
            );
          }
          
          // === PHASE 4: VOICE NARRATION ===
          logger.info(`[Orchestrator] Phase 4: Generating voice narration...`);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              phase: 'narrating',
              message: 'Preparing voice narration...'
            })}\n\n`)
          );
          
          // Generate voice with timestamps
          const voiceService = new EmotionVoiceService();
          
          if (voiceService.isAvailable) {
            try {
              const voiceConfig = {
                emotion: 'professional' as const,
                audience: 'adult' as const
              };
              
              const voice = await voiceService.generateVoiceWithTimestamps(
                plan.voiceScript.fullScript,
                voiceConfig
              );
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'voice',
                  data: {
                    audioUrl: voice.audioUrl,
                    duration: voice.duration,
                    wordTimestamps: voice.wordTimestamps
                  }
                })}\n\n`)
              );
              
              logger.info(`[Orchestrator] Voice generated: ${voice.duration}s`);
            } catch (voiceError) {
              logger.warn(`[Orchestrator] Voice generation failed:`, voiceError);
              // Continue without voice - visuals still work
            }
          } else {
            logger.warn(`[Orchestrator] Voice service not available, skipping audio`);
          }
          
          // === PHASE 5: HIGHLIGHT TIMELINE ===
          logger.info(`[Orchestrator] Phase 5: Sending highlight timeline...`);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'timeline',
              data: {
                points: plan.timeline.points,
                duration: plan.timeline.duration
              }
            })}\n\n`)
          );
          
          // === COMPLETE ===
          const totalTime = Date.now() - startTime;
          logger.info(`[Orchestrator] === COMPLETE in ${totalTime}ms ===`);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              data: {
                totalVisuals: plan.totalVisuals,
                totalTime,
                textRatio: plan.textRatio
              }
            })}\n\n`)
          );
          
          controller.close();
          
        } catch (error) {
          logger.error(`[Orchestrator] Error:`, error);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: error instanceof Error ? error.message : 'Generation failed'
            })}\n\n`)
          );
          
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    logger.error(`[Orchestrator] Request error:`, error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to start generation'
    }, { status: 500 });
  }
}

