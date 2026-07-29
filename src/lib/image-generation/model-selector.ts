/**
 * Model Selector
 * 
 * SIMPLIFIED: Always returns Google Gemini (single model)
 */

import type { Concept } from '@/types/master-plan';
import type { VisualType } from '@/lib/ai/visual-type-classifier';
import { MODEL_SPECIFICATIONS as _MODEL_SPECIFICATIONS } from './model-config';

export interface ModelSelection {
  modelName: string;
  provider: 'google-gemini';
  modelId: string;
  estimatedCost: number;
  expectedQuality: number;
  reason: string;
}

/**
 * Select model - always returns Gemini
 */
export function selectModel(
  _visualType?: VisualType,
  _concept?: Concept,
  _budget?: string
): ModelSelection {
  
  // Always use Gemini - simplified model selection
  // const spec = _MODEL_SPECIFICATIONS['gemini'];
  
  return {
    modelName: 'gemini',
    provider: 'google-gemini',
    modelId: 'gemini-2.5-flash',
    estimatedCost: 0.002,
    expectedQuality: 93,
    reason: 'Google Gemini 2.5 Flash - single model for all images'
  };
}

/**
 * Select models for batch of visuals
 */
export function selectModelsForBatch(
  concepts: Concept[],
  visualTypes: Map<number, VisualType>,
  budget: 'low' | 'medium' | 'high' = 'medium'
): Map<number, ModelSelection> {
  
  const selections = new Map<number, ModelSelection>();
  
  for (let i = 0; i < concepts.length; i++) {
    const taskId = i + 1;
    const visualType = visualTypes.get(taskId) || '2d-standard';
    const selection = selectModel(visualType, concepts[i], budget);
    selections.set(taskId, selection);
  }
  
  return selections;
}

/**
 * Get model distribution statistics
 */
export function getModelDistribution(
  selections: Map<number, ModelSelection>
): Record<string, number> {
  
  const distribution: Record<string, number> = {};
  
  for (const selection of selections.values()) {
    distribution[selection.modelName] = (distribution[selection.modelName] || 0) + 1;
  }
  
  return distribution;
}

/**
 * Calculate total estimated cost
 */
export function calculateTotalCost(
  selections: Map<number, ModelSelection>
): {
  total: number;
  byModel: Record<string, { count: number; cost: number }>;
} {
  
  const byModel: Record<string, { count: number; cost: number }> = {};
  let total = 0;
  
  for (const selection of selections.values()) {
    if (!byModel[selection.modelName]) {
      byModel[selection.modelName] = { count: 0, cost: 0 };
    }
    byModel[selection.modelName].count++;
    byModel[selection.modelName].cost += selection.estimatedCost;
    total += selection.estimatedCost;
  }
  
  return { total, byModel };
}

export default {
  selectModel,
  selectModelsForBatch,
  getModelDistribution,
  calculateTotalCost
};

