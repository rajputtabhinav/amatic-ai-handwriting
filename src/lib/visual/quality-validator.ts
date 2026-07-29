/**
 * SVG Quality Validator
 * 
 * Validates AI-generated SVG illustration quality.
 * Provides scoring and feedback for auto-retry system.
 * 
 * Focus: Educational SVG diagrams, NOT React components or character illustrations
 */

export interface QualityScore {
  score: number;          // 0-100
  passed: boolean;        // score >= 75
  metrics: {
    elementCount: number;
    elementDiversity: number;
    hasViewBox: boolean;
    hasXmlns: boolean;
    elementsWithIds: number;
    meaningfulIdRatio: number;
    hasTextLabels: boolean;
    hasGroups: boolean;
    colorCount: number;
    hasBackground: boolean;
    codeLength: number;
  };
  issues: string[];
}

/**
 * Validate SVG illustration quality for educational diagrams
 */
export function validateIllustrationQuality(code: string): QualityScore {
  const metrics = {
    elementCount: countSVGElements(code),
    elementDiversity: calculateElementDiversity(code),
    hasViewBox: hasSVGViewBox(code),
    hasXmlns: hasSVGXmlns(code),
    elementsWithIds: countElementsWithIds(code),
    meaningfulIdRatio: calculateMeaningfulIdRatio(code),
    hasTextLabels: hasTextElements(code),
    hasGroups: hasGroupElements(code),
    colorCount: countUniqueColors(code),
    hasBackground: hasOpaqueBackground(code),
    codeLength: code.length
  };
  
  // Calculate score based on SVG quality metrics
  let score = 0;
  const issues: string[] = [];
  
  // Element count (30 points) - Educational diagrams need 8-15 elements
  if (metrics.elementCount >= 8 && metrics.elementCount <= 15) {
    score += 30;
  } else if (metrics.elementCount >= 6) {
    score += 25;
    issues.push(`Element count ${metrics.elementCount} (target: 8-15 for educational clarity)`);
  } else if (metrics.elementCount >= 4) {
    score += 15;
    issues.push(`Too few elements: ${metrics.elementCount} (target: 8-15)`);
  } else {
    score += metrics.elementCount * 3;
    issues.push(`Too few elements: ${metrics.elementCount} (minimum: 4, target: 8-15)`);
  }
  
  // Element diversity (20 points) - Should use varied SVG elements
  if (metrics.elementDiversity >= 4) {
    score += 20;
  } else if (metrics.elementDiversity >= 3) {
    score += 15;
    issues.push(`Limited element types: ${metrics.elementDiversity} (use circles, rects, paths, text)`);
  } else {
    score += metrics.elementDiversity * 5;
    issues.push(`Too few element types: ${metrics.elementDiversity} (need variety: circles, rects, paths, etc.)`);
  }
  
  // ViewBox and xmlns (15 points) - Essential for SVG validity
  if (metrics.hasViewBox && metrics.hasXmlns) {
    score += 15;
  } else if (metrics.hasViewBox) {
    score += 10;
    issues.push('Missing xmlns attribute');
  } else if (metrics.hasXmlns) {
    score += 5;
    issues.push('Missing viewBox attribute');
  } else {
    issues.push('Missing both viewBox and xmlns - invalid SVG');
  }
  
  // Meaningful IDs (25 points) - Critical for educational relevance
  const idScore = Math.round(metrics.meaningfulIdRatio * 25);
  score += idScore;
  if (metrics.meaningfulIdRatio < 0.6) {
    issues.push(`Only ${Math.round(metrics.meaningfulIdRatio * 100)}% of elements have meaningful IDs (target: 60%+). Avoid generic IDs like "circle-1", "rect-2"`);
  } else if (metrics.meaningfulIdRatio < 0.8) {
    issues.push(`${Math.round(metrics.meaningfulIdRatio * 100)}% meaningful IDs (target: 80%+)`);
  }
  
  // Text labels (5 points) - Educational diagrams need labels
  if (metrics.hasTextLabels) {
    score += 5;
  } else {
    issues.push('Missing text labels - educational diagrams should label key concepts');
  }
  
  // Groups (5 points) - Shows logical organization
  if (metrics.hasGroups) {
    score += 5;
  }
  
  // Background check (deduct points for opaque background)
  if (metrics.hasBackground) {
    score -= 10;
    issues.push('Has opaque background - should be transparent for canvas integration');
  }
  
  return {
    score: Math.max(0, Math.min(score, 100)),
    passed: score >= 75, // Lower threshold for SVG vs React components
    metrics,
    issues
  };
}

/**
 * Count total SVG elements (shapes, paths, text, groups)
 */
function countSVGElements(code: string): number {
  const circles = (code.match(/<circle/gi) || []).length;
  const rects = (code.match(/<rect(?!\s+id="background")/gi) || []).length; // Exclude background rect
  const ellipses = (code.match(/<ellipse/gi) || []).length;
  const paths = (code.match(/<path/gi) || []).length;
  const lines = (code.match(/<line/gi) || []).length;
  const polygons = (code.match(/<polygon/gi) || []).length;
  const texts = (code.match(/<text/gi) || []).length;
  const groups = (code.match(/<g\s/gi) || []).length;
  
  return circles + rects + ellipses + paths + lines + polygons + texts + groups;
}

/**
 * Calculate element diversity (how many different types of SVG elements)
 */
function calculateElementDiversity(code: string): number {
  let diversity = 0;
  if (/<circle/i.test(code)) diversity++;
  if (/<rect/i.test(code)) diversity++;
  if (/<ellipse/i.test(code)) diversity++;
  if (/<path/i.test(code)) diversity++;
  if (/<line/i.test(code)) diversity++;
  if (/<polygon/i.test(code)) diversity++;
  if (/<text/i.test(code)) diversity++;
  if (/<g\s/i.test(code)) diversity++;
  
  return diversity;
}

/**
 * Check if SVG has viewBox attribute
 */
function hasSVGViewBox(code: string): boolean {
  return /viewBox\s*=\s*["'][^"']+["']/i.test(code);
}

/**
 * Check if SVG has xmlns attribute
 */
function hasSVGXmlns(code: string): boolean {
  return /xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(code);
}

/**
 * Count elements with id attributes
 */
function countElementsWithIds(code: string): number {
  const idMatches = code.match(/\sid\s*=\s*["'][^"']+["']/gi) || [];
  return idMatches.length;
}

/**
 * Calculate ratio of meaningful IDs vs generic IDs
 */
function calculateMeaningfulIdRatio(code: string): number {
  const idPattern = /id\s*=\s*["']([^"']+)["']/gi;
  const ids: string[] = [];
  let match;
  
  while ((match = idPattern.exec(code)) !== null) {
    ids.push(match[1]);
  }
  
  if (ids.length === 0) return 0;
  
  // Generic patterns to avoid
  const genericPatterns = [
    /^(circle|rect|ellipse|path|line|shape|element|item|decoration|layer)-?\d*$/i,
    /^(svg|group|container|wrapper)-?\d*$/i,
    /^(background|bg|base)$/i,
    /^[a-z]\d+$/i, // Single letter + number
    /^\d+$/  // Just numbers
  ];
  
  let meaningfulCount = 0;
  for (const id of ids) {
    const isGeneric = genericPatterns.some(pattern => pattern.test(id));
    if (!isGeneric) {
      meaningfulCount++;
    }
  }
  
  return meaningfulCount / ids.length;
}

/**
 * Check if SVG has text elements
 */
function hasTextElements(code: string): boolean {
  return /<text/i.test(code);
}

/**
 * Check if SVG has group elements
 */
function hasGroupElements(code: string): boolean {
  return /<g\s/i.test(code);
}

/**
 * Count unique colors in SVG
 */
function countUniqueColors(code: string): number {
  const colorPattern = /(?:fill|stroke)\s*=\s*["']#([a-f0-9]{6}|[a-f0-9]{3})["']/gi;
  const colorMatches = code.match(colorPattern) || [];
  
  const hexColors = colorMatches.map(match => {
    const hexMatch = match.match(/#([a-f0-9]{6}|[a-f0-9]{3})/i);
    if (hexMatch) {
      let hex = hexMatch[1].toLowerCase();
      // Normalize 3-char hex to 6-char
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      return '#' + hex;
    }
    return null;
  }).filter(Boolean);
  
  // Filter out white, black, and very light grays (often backgrounds)
  const meaningfulColors = hexColors.filter(color => 
    color !== '#ffffff' && 
    color !== '#000000' &&
    color !== '#fff' &&
    color !== '#000' &&
    !color?.match(/#f[ef][ef][ef][ef][ef]/) // Very light grays
  );
  
  return new Set(meaningfulColors).size;
}

/**
 * Check if SVG has an opaque background rectangle
 */
function hasOpaqueBackground(code: string): boolean {
  // Check for full-size background rectangles
  return /<rect[^>]*(?:width\s*=\s*["'](?:100%|400|600)["'][^>]*height\s*=\s*["'](?:100%|300|450)["']|height\s*=\s*["'](?:100%|300|450)["'][^>]*width\s*=\s*["'](?:100%|400|600)["'])/i.test(code);
}

/**
 * Build feedback for retry attempts
 */
export function buildQualityFeedback(validation: QualityScore): string {
  if (validation.passed) return '';
  
  const feedback: string[] = [
    '\n\nPREVIOUS ATTEMPT HAD QUALITY ISSUES (retry with improvements):',
    ''
  ];
  
  validation.issues.forEach(issue => {
    feedback.push(`- ${issue}`);
  });
  
  feedback.push('');
  feedback.push('GENERATE IMPROVED VERSION addressing all issues above.');
  
  return feedback.join('\n');
}

/**
 * Get quality grade for logging
 */
export function getQualityGrade(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'fair';
  return 'poor';
}

// Default export
export default {
  validateIllustrationQuality,
  buildQualityFeedback,
  getQualityGrade
};

