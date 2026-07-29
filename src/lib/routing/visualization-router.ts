/**
 * Visualization Router
 * 
 * Smart routing system that decides between 2D and 3D visualizations
 * based on query content and educational effectiveness.
 */

import { shouldUse3D, determine3DSceneType, Scene3DType } from '@/lib/3d/scene-generator';

export type VisualizationType = '2d-component' | '3d-scene';

export interface VisualizationDecision {
  type: VisualizationType;
  sceneType?: Scene3DType;
  rationale: string;
  confidence: number; // 0-1
  fallbackType?: VisualizationType;
}

/**
 * Visualization Router
 */
export class VisualizationRouter {
  /**
   * Decide optimal visualization type for query
   */
  decide(query: string): VisualizationDecision {
    const queryLower = query.toLowerCase();

    // Check if 3D is beneficial
    const needs3D = shouldUse3D(query);

    if (needs3D) {
      const sceneType = determine3DSceneType(query);
      return {
        type: '3d-scene',
        sceneType,
        rationale: this.get3DRationale(sceneType),
        confidence: this.calculate3DConfidence(queryLower, sceneType),
        fallbackType: '2d-component',
      };
    }

    // 2D is better for processes, flows, abstract concepts
    return {
      type: '2d-component',
      rationale: this.get2DRationale(queryLower),
      confidence: 0.85,
      fallbackType: undefined,
    };
  }

  /**
   * Get rationale for 3D choice
   */
  private get3DRationale(sceneType: Scene3DType): string {
    const rationales: Record<Scene3DType, string> = {
      '3d-molecule':
        'Molecular structures require 3D spatial understanding - rotation reveals bonds and geometry',
      '3d-solar-system':
        'Orbital mechanics and planetary positions best shown in 3D space',
      '3d-architecture':
        'Architectural structures need 3D perspective for spatial relationships',
      '3d-physics':
        'Physics simulations benefit from 3D space to show forces and motion',
      '3d-anatomy':
        'Anatomical structures require 3D visualization for accurate representation',
      '3d-generic':
        'Spatial concept benefits from 3D exploration and manipulation',
    };

    return rationales[sceneType];
  }

  /**
   * Get rationale for 2D choice
   */
  private get2DRationale(queryLower: string): string {
    if (
      queryLower.includes('process') ||
      queryLower.includes('cycle') ||
      queryLower.includes('flow')
    ) {
      return 'Process flows are clearer in 2D step-by-step format';
    }

    if (
      queryLower.includes('algorithm') ||
      queryLower.includes('code') ||
      queryLower.includes('logic')
    ) {
      return 'Algorithmic concepts work better with 2D diagrams and step sequences';
    }

    if (queryLower.includes('compare') || queryLower.includes('vs')) {
      return 'Comparisons are clearer in side-by-side 2D layout';
    }

    if (
      queryLower.includes('timeline') ||
      queryLower.includes('history') ||
      queryLower.includes('evolution')
    ) {
      return 'Temporal sequences work best in linear 2D format';
    }

    return 'Concept works well with interactive 2D components and animations';
  }

  /**
   * Calculate confidence in 3D decision
   */
  private calculate3DConfidence(
    queryLower: string,
    sceneType: Scene3DType
  ): number {
    let confidence = 0.7; // Base confidence

    // Strong 3D indicators
    const strong3DKeywords = [
      'molecule',
      'dna',
      'solar system',
      'planet',
      'rotate',
      'structure',
      '3d',
      'inside',
      'anatomy',
    ];

    const strongMatches = strong3DKeywords.filter((keyword) =>
      queryLower.includes(keyword)
    ).length;

    confidence += strongMatches * 0.1;

    // Scene-specific confidence boost
    if (sceneType === '3d-molecule' && queryLower.includes('bond')) {
      confidence += 0.1;
    }
    if (sceneType === '3d-solar-system' && queryLower.includes('orbit')) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * Should fallback to 2D?
   */
  shouldFallbackTo2D(error: Error, decision: VisualizationDecision): boolean {
    // If 3D fails and confidence wasn't very high, fallback to 2D
    return decision.type === '3d-scene' && decision.confidence < 0.8;
  }
}

/**
 * Route query to appropriate visualization
 */
export async function routeVisualization(
  query: string
): Promise<VisualizationDecision> {
  const router = new VisualizationRouter();
  return router.decide(query);
}

/**
 * Get visualization type with explanation
 */
export function explainVisualizationChoice(
  decision: VisualizationDecision
): string {
  return `Using ${decision.type === '3d-scene' ? '3D Scene' : '2D Interactive Component'}: ${decision.rationale} (Confidence: ${Math.round(decision.confidence * 100)}%)`;
}

export default {
  VisualizationRouter,
  routeVisualization,
  explainVisualizationChoice,
};

