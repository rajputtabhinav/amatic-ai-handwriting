/**
 * Image Generation Model Configuration
 * 
 * SIMPLIFIED: Single model only - Google Gemini 2.5 Flash
 */

export interface ModelSpec {
  provider: 'google-gemini';
  modelId: string;
  cost: number;
  quality: number;
  speed: number;
  bestFor: string[];
  notes?: string;
}

export const MODEL_SPECIFICATIONS: Record<string, ModelSpec> = {
  'gemini': {
    provider: 'google-gemini',
    modelId: 'gemini-2.5-flash',
    cost: 0.002,
    quality: 93,
    speed: 3,
    bestFor: ['all-educational-images'],
    notes: 'Single model for all image generation'
  }
};

/**
 * Get model spec by name
 */
export function getModelSpec(modelName: string): ModelSpec | undefined {
  return MODEL_SPECIFICATIONS[modelName];
}

/**
 * Get recommended model - always returns Gemini
 */
export function getRecommendedModel(
  _visualType?: string,
  _priority?: number,
  _budget?: string
): string {
  return 'gemini';
}

/**
 * Calculate cost for model mix
 */
export function calculateCost(distribution: Record<string, number>): number {
  let total = 0;
  
  for (const [model, count] of Object.entries(distribution)) {
    const spec = MODEL_SPECIFICATIONS[model];
    if (spec) {
      total += spec.cost * count;
    }
  }
  
  return total;
}

/**
 * Get optimal distribution - all use Gemini
 */
export function getOptimalDistribution(
  totalVisuals: number,
  _budget?: string
): Record<string, number> {
  return {
    'gemini': totalVisuals
  };
}

export default {
  MODEL_SPECIFICATIONS,
  getModelSpec,
  getRecommendedModel,
  calculateCost,
  getOptimalDistribution
};

