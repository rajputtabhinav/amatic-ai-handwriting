/**
 * Image Prompt Builder
 * 
 * Converts Master AI's detailed context into optimal prompts for:
 * - Nano Banana standard mode (85%)
 * - Nano Banana 3D-figurine mode (10%)
 * - DALL-E 3 (3%)
 * - True 3D models (2%)
 */

import type { DetailedWorkerBrief } from '@/types/master-plan';
import type { VisualType } from '@/lib/ai/visual-type-classifier';

export interface ImagePrompt {
  mainPrompt: string;
  negativePrompt: string;
  styleInstructions: string;
  technicalSpecs: string;
}

/**
 * Build Nano Banana standard 2D prompt
 */
export function buildNanoBananaStandardPrompt(brief: DetailedWorkerBrief): ImagePrompt {
  
  const mainPrompt = `Photorealistic visualization of ${brief.concept}.

STYLE & COMPOSITION:
Style: ${brief.styleGuidelines.illustrationStyle} with photorealistic quality
Visual elements to show: ${brief.visualRequirements.mustShow.join(', ')}
Emphasis: ${brief.visualRequirements.emphasize}
Metaphor: ${brief.visualRequirements.visualMetaphor}
Color palette: ${brief.styleGuidelines.primaryColors.join(', ')} with natural, realistic tones
Detail level: ${brief.visualRequirements.detailLevel}

EDUCATIONAL CONTEXT:
Teaching goal: ${brief.educationalGoal.whatToTeach}
Key insight: ${brief.educationalGoal.keyInsight}
User should understand: ${brief.educationalGoal.userUnderstanding}

PHOTOREALISTIC QUALITY:
- Style: Photorealistic, cinematic, professional photography
- Resolution: 8K, ultra high detail, realistic texture
- Background: Clean, professional, natural lighting
- Composition: ${brief.visualRequirements.emphasize}
- Lighting: Natural lighting, realistic shadows
- NO TEXT, NO LABELS, NO ANNOTATIONS on the image

NANO BANANA CONTROLS:
- Focus: Auto-focus on main subject
- Lighting: Natural, realistic
- Camera angle: Professional photography angle
- Color grading: Natural, realistic colors
- Quality: Ultra

Reference: ${brief.referenceStyle} in photorealistic style`;

  const negativePrompt = `${brief.qualityRequirements.avoidThese.join(', ')}, illustration, diagram, cartoon, sketch, drawing, animated, text, labels, annotations, watermark, blurry, low quality, background graphics, distracting elements, cluttered, confusing, amateur, unrealistic`;

  const styleInstructions = `Photorealistic style: ${brief.styleGuidelines.illustrationStyle}. Natural colors: ${brief.styleGuidelines.colorScheme}. Professional photography quality, 8K resolution, NO TEXT OR LABELS.`;

  const technicalSpecs = `Size: ${brief.technicalConstraints.size.width}×${brief.technicalConstraints.size.height}. Format: PNG. Photorealistic quality.`;

  return {
    mainPrompt,
    negativePrompt,
    styleInstructions,
    technicalSpecs
  };
}

/**
 * Build Nano Banana 3D-figurine mode prompt
 */
export function buildNanaBanana3DPrompt(brief: DetailedWorkerBrief): ImagePrompt {
  
  const mainPrompt = `Create a 3D-figurine style illustration of ${brief.concept} (2D image with three-dimensional appearance).

OBJECT DESCRIPTION:
${brief.visualRequirements.mustShow.join(', ')}

3D RENDER APPEARANCE (Important - must look 3D!):
- Render as if photographing a 3D model or figurine
- Studio lighting setup: Key light from upper left, fill light from right, rim light for edges
- Clear highlights on surfaces showing form and volume
- Cast shadow on ground plane (essential for 3D illusion!)
- Volumetric appearance with visible depth
- Material properties: ${brief.styleGuidelines.illustrationStyle} with realistic shading
- Depth cues: Foreground/background separation, atmospheric perspective

CAMERA & COMPOSITION:
- Camera angle: Slight angle (15-30 degrees) to reveal depth and dimensionality
- Perspective: Show multiple sides/faces of object
- Framing: Object centered with breathing room
- Focus: Sharp on subject, slight depth-of-field blur on edges

COLOR & STYLE:
Primary colors: ${brief.styleGuidelines.primaryColors.join(', ')}
Color grading: Enhanced contrast for 3D pop
Style: ${brief.styleGuidelines.illustrationStyle} with 3D render quality

EDUCATIONAL PURPOSE:
${brief.educationalGoal.whatToTeach}
Should convey depth and structure of ${brief.concept}

TECHNICAL:
- Background: Gradient (enhances 3D effect) or white with soft shadow
- Lighting: Studio quality, professional
- Shadows: Required for realism
- Highlights: Show form and volume
- Quality: 4K, professional 3D render appearance`;

  const negativePrompt = `flat, 2D looking, no shadows, no depth, no highlights, no volume, cartoon style (unless requested), low quality, blurry, text overlay, watermark, amateur, poorly lit`;

  const styleInstructions = `3D-figurine render style. Must appear three-dimensional with proper lighting, shadows, and highlights. Educational quality.`;

  const technicalSpecs = `Size: ${brief.technicalConstraints.size.width}×${brief.technicalConstraints.size.height}. 3D render appearance. Studio lighting.`;

  return {
    mainPrompt,
    negativePrompt,
    styleInstructions,
    technicalSpecs
  };
}

/**
 * Build DALL-E 3 prompt (for hero images)
 */
export function buildDALLE3Prompt(brief: DetailedWorkerBrief): string {
  return `Photorealistic, cinematic visualization of ${brief.concept}.

${brief.visualRequirements.mustShow.join(', ')}

Style: ${brief.styleGuidelines.illustrationStyle} with photorealistic quality
Quality: Ultra-realistic, professional photography, 8K resolution, cinematic lighting
Purpose: ${brief.educationalGoal.whatToTeach}
Emphasis: ${brief.visualRequirements.emphasize}
Background: Clean, professional, natural lighting
Colors: ${brief.styleGuidelines.primaryColors.join(', ')} with realistic tones
Lighting: Natural, professional photography lighting

NO TEXT, NO LABELS, NO ANNOTATIONS on the image.

This is a hero/key visual - maximum photorealistic quality and detail required.`;
}

/**
 * Build 3D model prompt (Meshy/Tripo/Luma)
 */
export function build3DModelPrompt(brief: DetailedWorkerBrief): ImagePrompt {
  
  const mainPrompt = `Detailed 3D model of ${brief.concept} for educational visualization.

STRUCTURE & DETAILS:
${brief.visualRequirements.mustShow.join(', ')}

MODEL SPECIFICATIONS:
- Type: Educational 3D visualization
- Style: ${brief.styleGuidelines.illustrationStyle}
- Topology: Clean mesh, optimized for real-time web rendering
- Poly count: Medium (50K-100K triangles for balance)
- Textures: High quality, PBR materials
- Colors: ${brief.styleGuidelines.primaryColors.join(', ')}

EDUCATIONAL CONTEXT:
Purpose: ${brief.educationalGoal.whatToTeach}
Should clearly demonstrate: ${brief.educationalGoal.keyInsight}

TECHNICAL REQUIREMENTS:
- Format: GLB (web-ready)
- Optimized for: Browser rendering via React Three Fiber
- Interactive: User can rotate, zoom, pan
- Scale: Appropriate for educational context
- Origin: Centered at (0, 0, 0)`;

  const negativePrompt = `low poly (unless requested), poor topology, broken mesh, missing textures, low resolution textures, unrealistic, cartoon (unless requested)`;

  const styleInstructions = `Educational 3D model. Clean topology, good textures, optimized for web.`;

  const technicalSpecs = `GLB format. 50K-100K triangles. PBR textures. Web-optimized.`;

  return {
    mainPrompt,
    negativePrompt,
    styleInstructions,
    technicalSpecs
  };
}

/**
 * Build complete prompt package for worker
 */
export function buildPromptForWorker(
  brief: DetailedWorkerBrief,
  _visualType: VisualType,
  modelName: string
): ImagePrompt {
  
  // Select appropriate prompt builder
  if (modelName === 'nano-banana') {
    return buildNanoBananaStandardPrompt(brief);
  }
  else if (modelName === 'nano-banana-3d') {
    return buildNanaBanana3DPrompt(brief);
  }
  else if (modelName === 'dall-e-3') {
    const mainPrompt = buildDALLE3Prompt(brief);
    return {
      mainPrompt,
      negativePrompt: brief.qualityRequirements.avoidThese.join(', '),
      styleInstructions: brief.styleGuidelines.illustrationStyle,
      technicalSpecs: 'HD quality, 1024×1024'
    };
  }
  else if (['meshy', 'tripo', 'luma'].includes(modelName)) {
    return build3DModelPrompt(brief);
  }
  
  // Fallback to standard
  return buildNanoBananaStandardPrompt(brief);
}

