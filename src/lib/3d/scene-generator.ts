/**
 * 3D Scene Generator
 * 
 * AI generates Three.js/React Three Fiber code for spatial concepts.
 * Handles molecules, solar systems, architecture, and physics simulations.
 */

import { createAnthropicClient } from '@/lib/api/anthropic-client';

export type Scene3DType =
  | '3d-molecule'
  | '3d-solar-system'
  | '3d-architecture'
  | '3d-physics'
  | '3d-anatomy'
  | '3d-generic';

export interface Scene3DConfig {
  type: Scene3DType;
  code: string;
  concepts: string[];
  cameraPosition: [number, number, number];
  interactions: string[];
}

/**
 * Generate 3D scene code from query
 */
export async function generate3DScene(
  query: string,
  sceneType: Scene3DType,
  audience: 'kid' | 'teen' | 'adult' | 'professional' = 'adult'
): Promise<Scene3DConfig> {
  const client = createAnthropicClient({}, 'svgGeneration');
  const concepts = extractConcepts(query);
  const componentName = generateComponentName(query);

  const systemPrompt = buildSystemPrompt(sceneType, audience, concepts, componentName);
  const userPrompt = buildUserPrompt(query, sceneType, concepts);

  let fullContent = '';

  for await (const chunk of client.streamReasoning(userPrompt, systemPrompt)) {
    if (chunk.type === 'content') {
      fullContent += chunk.text;
    }
  }

  // Extract code
  let code = fullContent;
  const codeBlockMatch = fullContent.match(/```(?:tsx|typescript|jsx)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1];
  }

  return {
    type: sceneType,
    code,
    concepts,
    cameraPosition: getCameraPosition(sceneType),
    interactions: ['rotate', 'zoom', 'pan'],
  };
}

/**
 * Build system prompt for 3D generation
 */
function buildSystemPrompt(
  sceneType: Scene3DType,
  audience: string,
  concepts: string[],
  componentName: string
): string {
  const basePrompt = `You are an expert 3D visualization generator using React Three Fiber.

CRITICAL: Generate a fully functional 3D scene that explains the concept through spatial visualization.

KEY CONCEPTS: ${concepts.join(', ')}
All 3D objects must relate to these concepts with descriptive names.

MANDATORY STRUCTURE:
1. Import { Canvas, useFrame } from '@react-three/fiber'
2. Import { OrbitControls, Sphere, Box, Line, Text } from '@react-three/drei'
3. Import { useRef, useState } from 'react'
4. Export default function ${componentName}()
5. Include lighting (ambientLight + spotLight)
6. Add OrbitControls for user interaction
7. Animate objects with useFrame when appropriate

TECHNICAL REQUIREMENTS:
- Use TypeScript with proper types
- All 3D objects need meaningful names (not "sphere1", "box2")
- Camera position appropriate for the scene
- Proper lighting for visibility
- Interactive elements (clickable, hoverable)
- Smooth animations where relevant

AUDIENCE: ${audience}`;

  // Scene-specific additions
  const sceneSpecific = getSceneSpecificPrompt(sceneType);

  return basePrompt + '\n\n' + sceneSpecific;
}

/**
 * Get scene-specific prompt additions
 */
function getSceneSpecificPrompt(sceneType: Scene3DType): string {
  switch (sceneType) {
    case '3d-molecule':
      return `MOLECULAR STRUCTURE RULES:
- Use <Sphere> for atoms with element-specific colors
- Use <Line> for bonds between atoms
- Accurate spatial positioning
- Include atom labels with <Text>
- Allow rotation to see structure from all angles
- Color code by element type (C=gray, O=red, H=white, N=blue)`;

    case '3d-solar-system':
      return `SOLAR SYSTEM RULES:
- Central sun with emissive material
- Planets orbit using useFrame animation
- Accurate relative sizes and distances (scaled)
- Orbit paths visible as lines
- Planet labels
- Realistic colors for each planet`;

    case '3d-architecture':
      return `ARCHITECTURE RULES:
- Use <Box> for building blocks
- Proper scale and proportions
- Multiple viewing angles
- Structural elements labeled
- Allow walking through with camera controls`;

    case '3d-physics':
      return `PHYSICS SIMULATION RULES:
- Objects with mass and velocity
- Real-time physics using useFrame
- Gravity simulation
- Collision detection (basic)
- Visual indicators for forces
- Interactive: click to apply force`;

    case '3d-anatomy':
      return `ANATOMICAL STRUCTURE RULES:
- Accurate proportions and positioning
- Color-coded systems/organs
- Cross-section views
- Labels for major parts
- Allow rotation and zoom for examination`;

    default:
      return `GENERIC 3D RULES:
- Clear spatial relationships
- Logical 3D arrangement
- Interactive exploration
- Descriptive labels`;
  }
}

/**
 * Build user prompt
 */
function buildUserPrompt(
  query: string,
  sceneType: Scene3DType,
  concepts: string[]
): string {
  return `Generate a 3D React Three Fiber scene that explains: "${query}"

Scene Type: ${sceneType}
Must visualize: ${concepts.join(', ')}

Create an interactive 3D scene that:
1. Shows the spatial structure/relationships
2. Allows rotation, zoom, and exploration
3. Includes labels for key components
4. Uses animations where appropriate

Output ONLY the React/TypeScript code with Three.js.
Start with imports, end with export default.
No markdown blocks, no explanations outside code.`;
}

/**
 * Extract concepts from query
 */
function extractConcepts(query: string): string[] {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'is',
    'are',
    'how',
    'what',
    'show',
    'me',
    'of',
    'in',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 6);
}

/**
 * Generate component name
 */
function generateComponentName(query: string): string {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);

  return (
    words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('') +
    'Scene3D'
  );
}

/**
 * Get default camera position for scene type
 */
function getCameraPosition(sceneType: Scene3DType): [number, number, number] {
  switch (sceneType) {
    case '3d-molecule':
      return [0, 0, 8];
    case '3d-solar-system':
      return [0, 10, 20];
    case '3d-architecture':
      return [10, 5, 10];
    case '3d-physics':
      return [0, 5, 15];
    case '3d-anatomy':
      return [0, 0, 10];
    default:
      return [0, 0, 10];
  }
}

/**
 * Detect if query needs 3D visualization
 */
export function shouldUse3D(query: string): boolean {
  const queryLower = query.toLowerCase();

  const needs3DKeywords = [
    'molecule',
    'molecular',
    'dna',
    'protein',
    'atom',
    'structure',
    'solar system',
    'planet',
    'orbit',
    'space',
    'architecture',
    'building',
    '3d',
    'rotate',
    'inside',
    'walk through',
    'anatomy',
    'organ',
    'body',
    'cell structure',
  ];

  return needs3DKeywords.some((keyword) => queryLower.includes(keyword));
}

/**
 * Determine 3D scene type from query
 */
export function determine3DSceneType(query: string): Scene3DType {
  const queryLower = query.toLowerCase();

  if (
    queryLower.includes('molecule') ||
    queryLower.includes('molecular') ||
    queryLower.includes('dna') ||
    queryLower.includes('protein') ||
    queryLower.includes('atom')
  ) {
    return '3d-molecule';
  }

  if (
    queryLower.includes('solar') ||
    queryLower.includes('planet') ||
    queryLower.includes('orbit') ||
    queryLower.includes('space')
  ) {
    return '3d-solar-system';
  }

  if (
    queryLower.includes('building') ||
    queryLower.includes('architecture') ||
    queryLower.includes('structure')
  ) {
    return '3d-architecture';
  }

  if (
    queryLower.includes('physics') ||
    queryLower.includes('force') ||
    queryLower.includes('gravity') ||
    queryLower.includes('motion')
  ) {
    return '3d-physics';
  }

  if (
    queryLower.includes('anatomy') ||
    queryLower.includes('organ') ||
    queryLower.includes('body') ||
    queryLower.includes('heart') ||
    queryLower.includes('brain')
  ) {
    return '3d-anatomy';
  }

  return '3d-generic';
}

export default {
  generate3DScene,
  shouldUse3D,
  determine3DSceneType,
};

