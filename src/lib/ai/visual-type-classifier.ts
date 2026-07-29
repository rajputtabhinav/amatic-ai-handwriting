/**
 * Visual Type Classifier
 * 
 * Classifies each concept into:
 * - 2D Standard (85%) → Nano Banana standard mode
 * - 3D-Style 2D (10%) → Nano Banana 3D-figurine mode (looks 3D!)
 * - True 3D Model (5%) → Meshy/Tripo (rotatable GLB)
 */

import type { Concept } from '@/types/master-plan';

export type VisualType = '2d-standard' | '3d-style-2d' | 'true-3d';

export interface VisualTypeDecision {
  type: VisualType;
  confidence: number;
  reason: string;
}

/**
 * Classify concept into visual type
 */
export function classifyVisualType(concept: Concept, query: string): VisualTypeDecision {
  
  const conceptLower = concept.name.toLowerCase();
  const queryLower = query.toLowerCase();
  const keywords = concept.keywords.map(k => k.toLowerCase());
  
  // === TRUE 3D MODEL (5%) ===
  // Only when user MUST rotate to understand
  
  const requires3D = [
    'dna helix', 'double helix', 'molecular structure', 'protein folding',
    'crystal structure', 'architectural model', 'building design',
    'mechanical assembly', 'gear system', 'complex machinery'
  ];
  
  if (requires3D.some(term => conceptLower.includes(term) || queryLower.includes(term))) {
    return {
      type: 'true-3d',
      confidence: 0.9,
      reason: 'Complex spatial structure requiring rotation to understand'
    };
  }
  
  // Check for rotation keywords
  if (keywords.some(k => ['rotate', 'rotation', 'all-sides', '360', 'spatial'].includes(k))) {
    return {
      type: 'true-3d',
      confidence: 0.85,
      reason: 'Concept explicitly requires rotation for understanding'
    };
  }
  
  // === 3D-STYLE 2D (10%) ===
  // Benefits from depth but doesn't need rotation
  
  const benefits3DStyle = [
    'cell', 'organ', 'heart', 'brain', 'lung', 'liver',
    'molecule', 'atom', 'particle', 'sphere', 'cube', 'object',
    'product', 'tool', 'device', 'instrument', 'apparatus',
    'character', 'figure', 'person', 'animal', 'creature',
    'building', 'structure', 'model', 'prototype'
  ];
  
  if (benefits3DStyle.some(term => conceptLower.includes(term))) {
    // But check if it really needs rotation
    const needsRotation = conceptLower.includes('complex') ||
                         conceptLower.includes('intricate') ||
                         conceptLower.includes('detailed structure');
    
    if (!needsRotation) {
      return {
        type: '3d-style-2d',
        confidence: 0.8,
        reason: 'Benefits from depth perception but single view sufficient'
      };
    }
  }
  
  // Objects that look better with 3D appearance
  if (concept.keywords.some(k => ['3d', 'volume', 'depth', 'dimensional'].includes(k.toLowerCase()))) {
    return {
      type: '3d-style-2d',
      confidence: 0.75,
      reason: 'Concept benefits from volumetric appearance'
    };
  }
  
  // === 2D STANDARD (85%) ===
  // Default for most educational content
  
  return {
    type: '2d-standard',
    confidence: 0.9,
    reason: 'Standard diagram/illustration sufficient for concept'
  };
}

/**
 * Batch classify multiple concepts
 */
export function classifyVisualTypes(
  concepts: Concept[],
  query: string
): Map<number, VisualTypeDecision> {
  
  const classifications = new Map<number, VisualTypeDecision>();
  
  for (let i = 0; i < concepts.length; i++) {
    classifications.set(i + 1, classifyVisualType(concepts[i], query));
  }
  
  return classifications;
}

/**
 * Get distribution statistics
 */
export function getDistributionStats(
  classifications: Map<number, VisualTypeDecision>
): {
  standard2D: number;
  style3D2D: number;
  true3D: number;
  percentages: { standard2D: number; style3D2D: number; true3D: number };
} {
  
  const total = classifications.size;
  let standard2D = 0, style3D2D = 0, true3D = 0;
  
  for (const decision of classifications.values()) {
    if (decision.type === '2d-standard') standard2D++;
    else if (decision.type === '3d-style-2d') style3D2D++;
    else if (decision.type === 'true-3d') true3D++;
  }
  
  return {
    standard2D,
    style3D2D,
    true3D,
    percentages: {
      standard2D: (standard2D / total) * 100,
      style3D2D: (style3D2D / total) * 100,
      true3D: (true3D / total) * 100
    }
  };
}

export default {
  classifyVisualType,
  classifyVisualTypes,
  getDistributionStats
};

