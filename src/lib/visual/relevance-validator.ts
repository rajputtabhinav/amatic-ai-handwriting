/**
 * SVG Content Relevance Validator
 * 
 * Validates that SVG content actually explains the query topic.
 * Checks element IDs, text labels, and semantic coherence.
 */

export interface RelevanceScore {
  score: number;          // 0-100
  passed: boolean;        // score >= 70
  metrics: {
    keywordMatchRatio: number;
    meaningfulElements: number;
    totalElements: number;
    hasRelevantLabels: boolean;
    conceptCoverage: number;
  };
  issues: string[];
  missingConcepts: string[];
}

/**
 * Validate SVG relevance to query
 */
export function validateSVGRelevance(svgCode: string, query: string): RelevanceScore {
  const keyConcepts = extractKeyConcepts(query);
  const elementIds = extractElementIds(svgCode);
  const textLabels = extractTextLabels(svgCode);
  
  const metrics = {
    keywordMatchRatio: calculateKeywordMatchRatio(elementIds, textLabels, keyConcepts),
    meaningfulElements: countMeaningfulElements(elementIds, keyConcepts),
    totalElements: elementIds.length,
    hasRelevantLabels: hasRelevantTextLabels(textLabels, keyConcepts),
    conceptCoverage: calculateConceptCoverage(elementIds, textLabels, keyConcepts)
  };
  
  let score = 0;
  const issues: string[] = [];
  const missingConcepts: string[] = [];
  
  // Keyword match ratio (40 points)
  const keywordScore = Math.round(metrics.keywordMatchRatio * 40);
  score += keywordScore;
  
  if (metrics.keywordMatchRatio < 0.3) {
    issues.push(`Very low keyword match: ${Math.round(metrics.keywordMatchRatio * 100)}% (target: 30%+)`);
    issues.push('Element IDs and labels do not relate to the query topic');
  } else if (metrics.keywordMatchRatio < 0.5) {
    issues.push(`Low keyword match: ${Math.round(metrics.keywordMatchRatio * 100)}% (target: 50%+)`);
  }
  
  // Concept coverage (40 points)
  const coverageScore = Math.round(metrics.conceptCoverage * 40);
  score += coverageScore;
  
  if (metrics.conceptCoverage < 0.4) {
    issues.push(`Poor concept coverage: ${Math.round(metrics.conceptCoverage * 100)}%`);
    
    // Identify missing concepts
    for (const concept of keyConcepts) {
      const found = elementIds.some(id => id.toLowerCase().includes(concept.toLowerCase())) ||
                    textLabels.some(label => label.toLowerCase().includes(concept.toLowerCase()));
      if (!found) {
        missingConcepts.push(concept);
      }
    }
    
    if (missingConcepts.length > 0) {
      issues.push(`Missing visual representations of: ${missingConcepts.join(', ')}`);
    }
  }
  
  // Relevant text labels (20 points)
  if (metrics.hasRelevantLabels) {
    score += 20;
  } else if (textLabels.length > 0) {
    score += 10;
    issues.push('Text labels present but not relevant to query concepts');
  } else {
    issues.push('Missing text labels for key concepts');
  }
  
  return {
    score: Math.min(score, 100),
    passed: score >= 70,
    metrics,
    issues,
    missingConcepts
  };
}

/**
 * Extract key concepts from query
 */
function extractKeyConcepts(query: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'how', 'what', 'why',
    'does', 'do', 'did', 'will', 'would', 'could', 'should', 'can', 'work', 'works',
    'explain', 'me', 'please', 'tell', 'show', 'about', 'of', 'to', 'in', 'for', 'on',
    'with', 'at', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'all', 'both', 'each'
  ]);
  
  const words = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  // Add important compound terms
  const compoundTerms: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Technology
  if (queryLower.includes('ai') || queryLower.includes('artificial intelligence')) {
    compoundTerms.push('ai', 'artificial-intelligence', 'neural', 'network', 'intelligence');
  }
  if (queryLower.includes('neural network')) compoundTerms.push('neural', 'network', 'neural-network');
  if (queryLower.includes('machine learning')) compoundTerms.push('machine', 'learning', 'machine-learning');
  if (queryLower.includes('data flow')) compoundTerms.push('data', 'flow', 'data-flow');
  if (queryLower.includes('algorithm')) compoundTerms.push('algorithm', 'process', 'computation');
  if (queryLower.includes('engine')) compoundTerms.push('engine', 'mechanism', 'process');
  
  // Science
  if (queryLower.includes('photosynthesis')) compoundTerms.push('photosynthesis', 'chloroplast', 'sunlight', 'oxygen', 'carbon');
  if (queryLower.includes('solar system')) compoundTerms.push('solar', 'system', 'planet', 'sun', 'orbit');
  if (queryLower.includes('water cycle')) compoundTerms.push('water', 'cycle', 'evaporation', 'condensation', 'precipitation');
  if (queryLower.includes('cell')) compoundTerms.push('cell', 'membrane', 'nucleus', 'organism');
  
  // Business
  if (queryLower.includes('stock market')) compoundTerms.push('stock', 'market', 'trading', 'price', 'share');
  if (queryLower.includes('supply') && queryLower.includes('demand')) compoundTerms.push('supply', 'demand', 'price', 'market');
  
  const allConcepts = [...new Set([...words, ...compoundTerms])];
  return allConcepts.slice(0, 10); // Top 10 concepts
}

/**
 * Extract element IDs from SVG
 */
function extractElementIds(svgCode: string): string[] {
  const idPattern = /id\s*=\s*["']([^"']+)["']/gi;
  const ids: string[] = [];
  let match;
  
  while ((match = idPattern.exec(svgCode)) !== null) {
    // Skip generic IDs like "background", "defs", "svg"
    const id = match[1];
    if (!id.match(/^(background|bg|defs|svg|root|main)$/i)) {
      ids.push(id);
    }
  }
  
  return ids;
}

/**
 * Extract text labels from SVG
 */
function extractTextLabels(svgCode: string): string[] {
  const textPattern = /<text[^>]*>([^<]+)<\/text>/gi;
  const labels: string[] = [];
  let match;
  
  while ((match = textPattern.exec(svgCode)) !== null) {
    const text = match[1].trim();
    if (text.length > 0 && text.length < 50) { // Reasonable label length
      labels.push(text);
    }
  }
  
  return labels;
}

/**
 * Calculate keyword match ratio
 */
function calculateKeywordMatchRatio(elementIds: string[], textLabels: string[], keyConcepts: string[]): number {
  if (keyConcepts.length === 0) return 1; // No concepts to match
  
  const allContent = [...elementIds, ...textLabels].join(' ').toLowerCase();
  
  let matchCount = 0;
  for (const concept of keyConcepts) {
    if (allContent.includes(concept.toLowerCase())) {
      matchCount++;
    }
  }
  
  return matchCount / keyConcepts.length;
}

/**
 * Count meaningful elements (those that relate to query)
 */
function countMeaningfulElements(elementIds: string[], keyConcepts: string[]): number {
  let count = 0;
  
  for (const id of elementIds) {
    const idLower = id.toLowerCase();
    
    // Check if ID contains any concept
    const hasConcept = keyConcepts.some(concept => 
      idLower.includes(concept.toLowerCase())
    );
    
    // Check if ID is descriptive (not generic like "circle-1")
    const isDescriptive = !idLower.match(/^(circle|rect|ellipse|path|shape|element|item|layer)-?\d*$/i);
    
    if (hasConcept || isDescriptive) {
      count++;
    }
  }
  
  return count;
}

/**
 * Check if text labels are relevant to query
 */
function hasRelevantTextLabels(textLabels: string[], keyConcepts: string[]): boolean {
  if (textLabels.length === 0) return false;
  
  const labelsContent = textLabels.join(' ').toLowerCase();
  
  // At least one concept should appear in labels
  return keyConcepts.some(concept => 
    labelsContent.includes(concept.toLowerCase())
  );
}

/**
 * Calculate concept coverage (what % of concepts are visually represented)
 */
function calculateConceptCoverage(elementIds: string[], textLabels: string[], keyConcepts: string[]): number {
  if (keyConcepts.length === 0) return 1;
  
  const allContent = [...elementIds, ...textLabels].join(' ').toLowerCase();
  
  let coveredCount = 0;
  for (const concept of keyConcepts) {
    // Check for concept or related terms
    const conceptLower = concept.toLowerCase();
    const hasDirectMatch = allContent.includes(conceptLower);
    
    // Check for semantic variations
    const variations = getConceptVariations(concept);
    const hasVariation = variations.some(variation => allContent.includes(variation.toLowerCase()));
    
    if (hasDirectMatch || hasVariation) {
      coveredCount++;
    }
  }
  
  return coveredCount / keyConcepts.length;
}

/**
 * Get semantic variations of a concept
 */
function getConceptVariations(concept: string): string[] {
  const variations: Record<string, string[]> = {
    'ai': ['artificial', 'intelligence', 'neural', 'network', 'ml', 'ai'],
    'neural': ['neuron', 'network', 'layer', 'brain'],
    'network': ['net', 'connection', 'graph', 'system'],
    'data': ['information', 'input', 'output', 'process'],
    'flow': ['stream', 'pipeline', 'path', 'direction'],
    'engine': ['motor', 'mechanism', 'system', 'processor'],
    'process': ['processing', 'procedure', 'operation', 'workflow'],
    'algorithm': ['computation', 'calculation', 'logic', 'procedure'],
    'photosynthesis': ['chloroplast', 'sunlight', 'plant', 'oxygen', 'carbon'],
    'cell': ['membrane', 'nucleus', 'organism', 'cellular'],
    'planet': ['orbital', 'celestial', 'astronomical', 'space'],
    'market': ['trading', 'exchange', 'economy', 'price'],
    'stock': ['share', 'equity', 'security', 'investment']
  };
  
  const conceptLower = concept.toLowerCase();
  return variations[conceptLower] || [concept];
}

/**
 * Build feedback message for retry attempts
 */
export function buildRelevanceFeedback(relevance: RelevanceScore, query: string): string {
  if (relevance.passed) return '';
  
  const feedback: string[] = [
    '\n\n❌ PREVIOUS SVG WAS IRRELEVANT TO THE QUERY - RETRY WITH CORRECTIONS:',
    '',
    `Query: "${query}"`
  ];
  
  if (relevance.missingConcepts.length > 0) {
    feedback.push('');
    feedback.push('MISSING VISUAL REPRESENTATIONS:');
    relevance.missingConcepts.forEach(concept => {
      feedback.push(`  - Must include: ${concept}`);
    });
  }
  
  if (relevance.issues.length > 0) {
    feedback.push('');
    feedback.push('ISSUES TO FIX:');
    relevance.issues.forEach(issue => {
      feedback.push(`  - ${issue}`);
    });
  }
  
  feedback.push('');
  feedback.push('REQUIREMENTS FOR RETRY:');
  feedback.push('1. Element IDs must reference the query concepts (e.g., id="neural-network", id="data-processor")');
  feedback.push('2. Include text labels for key terms from the query');
  feedback.push('3. Visual structure must explain the specific topic, not generic shapes');
  feedback.push('4. Avoid generic IDs like "circle-1", "rect-2", "shape-3"');
  
  return feedback.join('\n');
}

// Default export
export default {
  validateSVGRelevance,
  buildRelevanceFeedback
};

