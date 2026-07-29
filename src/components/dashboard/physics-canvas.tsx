'use client';

/**
 * Physics Canvas Component
 * 
 * 60fps physics rendering for animated SVG illustrations.
 * Integrates Matter.js physics with SVG animations.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createMatterClient, MatterClient } from '@/lib/physics/matter-client';
import { ElementPhysicsManager, createElementPhysicsManager, ElementPhysicsState } from '@/lib/physics/element-physics';
import { ParticleSystem, createParticleSystem } from '@/lib/physics/particle-system';
// SVG animator removed - using Framer Motion in React components now
import { getPresetForTopic } from '@/lib/physics/physics-presets';
import { SVGElementData, PhysicsProperties } from '@/lib/api/anthropic-client';
import { sanitizeSVG, sanitizeCSS } from '@/lib/utils';

interface AnimationState {
  transform: string;
  opacity: number;
}

export interface PhysicsCanvasProps {
  svgCode: string;
  elements: SVGElementData[];
  physics: PhysicsProperties;
  topic?: string;
  isPlaying?: boolean;
  onElementClick?: (elementId: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

interface ElementStates {
  physics: Map<string, ElementPhysicsState>;
  animation: Map<string, AnimationState>;
}

function generateCSSAnimations(): string {
  return '';
}

export function PhysicsCanvas({
  svgCode,
  elements,
  physics,
  topic = 'general',
  isPlaying = true,
  onElementClick,
  className = '',
  width = 400,
  height = 300
}: PhysicsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const matterClientRef = useRef<MatterClient | null>(null);
  const physicsManagerRef = useRef<ElementPhysicsManager | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const animatorRef = useRef<{
    clear: () => void;
    getAllStates: () => Map<string, AnimationState>;
    start: () => void;
    stop: () => void;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [elementStates, setElementStates] = useState<ElementStates>({
    physics: new Map(),
    animation: new Map()
  });

  // Initialize physics engine and animator
  useEffect(() => {
    const init = async () => {
      try {
        // Skip initialization if no valid elements or physics data
        if (!elements || elements.length === 0 || !physics?.elements) {
          setIsInitialized(true); // Mark as initialized to show SVG without physics
          return;
        }

        // Create instances
        matterClientRef.current = createMatterClient();
        physicsManagerRef.current = createElementPhysicsManager(matterClientRef.current);
        particleSystemRef.current = createParticleSystem();
        animatorRef.current = {
          clear: () => undefined,
          getAllStates: () => new Map(),
          start: () => undefined,
          stop: () => undefined,
        };

        // Get preset based on topic
        const preset = getPresetForTopic(topic);
        
        // Initialize physics manager
        await physicsManagerRef.current.initialize(preset);

        // React components handle their own animations via Framer Motion
        // Physics system not needed for React components
        // TODO: Remove or refactor physics-canvas for React components
        /*
        for (const element of elements) {
          const elementPhysics = physics.elements.find(p => p.id === element.id);
          if (elementPhysics) {
            // Parse element bounds...
          }
        }
        */

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize physics canvas:', error);
        setIsInitialized(true); // Still mark as initialized to show fallback
      }
    };

    init();

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      physicsManagerRef.current?.stop();
      physicsManagerRef.current?.clear();
      particleSystemRef.current?.clear();
      animatorRef.current?.clear();
      matterClientRef.current?.destroy();
    };
  }, [svgCode, elements, physics, topic]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized || !isPlaying) return;

    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update physics
      if (physicsManagerRef.current) {
        const physicsStates = physicsManagerRef.current.update(deltaTime);
        
        // Update particles
        if (particleSystemRef.current) {
          particleSystemRef.current.update(deltaTime);
        }

        // Get animation states
        const animationStates = animatorRef.current?.getAllStates() || new Map();

        // Update state
        setElementStates({
          physics: physicsStates,
          animation: animationStates
        });

        // Apply to DOM
        applyStatesToDOM();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    physicsManagerRef.current?.start();
    animatorRef.current?.start();
    particleSystemRef.current?.start();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      physicsManagerRef.current?.stop();
      animatorRef.current?.stop();
      particleSystemRef.current?.stop();
    };
  }, [isInitialized, isPlaying]);

  // Apply states to SVG DOM elements
  const applyStatesToDOM = useCallback(() => {
    if (!svgRef.current) return;

    for (const [elementId, state] of elementStates.physics) {
      const element = svgRef.current.querySelector(`#${CSS.escape(elementId)}`);
      if (element instanceof SVGElement) {
        // Combine physics and animation transforms
        const animState = elementStates.animation.get(elementId);
        
        let transform = '';
        let opacity = state.opacity;
        
        // Physics transform
        const physicsTransform = `translate(${state.x}px, ${state.y}px) rotate(${state.angle * 180 / Math.PI}deg) scale(${state.scale})`;
        
        // Animation transform (additive)
        if (animState) {
          transform = `${physicsTransform} ${animState.transform}`;
          opacity *= animState.opacity;
        } else {
          transform = physicsTransform;
        }
        
        element.style.transform = transform;
        element.style.opacity = opacity.toString();
        element.style.transformOrigin = 'center';
        element.style.transformBox = 'fill-box';
      }
    }
  }, [elementStates]);

  // Handle element click
  const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const target = event.target as SVGElement;
    if (target.id && onElementClick) {
      onElementClick(target.id);
    }
  }, [onElementClick]);

  // Inject particle SVG
  const particleSVG = particleSystemRef.current?.generateSVG() || '';

  // Sanitize SVG and CSS content for XSS prevention
  const sanitizedCSS = useMemo(() => sanitizeCSS(generateCSSAnimations()), []);
  const sanitizedSVGContent = useMemo(() => {
    const innerSVG = svgCode.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    return sanitizeSVG(innerSVG + particleSVG);
  }, [svgCode, particleSVG]);

  return (
    <div 
      ref={containerRef}
      className={`physics-canvas-container relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: sanitizedCSS }} />
      
      {/* Main SVG with physics */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        onClick={handleClick}
        className="w-full h-full"
        style={{ 
          backgroundColor: 'transparent',
          cursor: onElementClick ? 'pointer' : 'default'
        }}
        dangerouslySetInnerHTML={{ 
          __html: sanitizedSVGContent 
        }}
      />
      
      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="bg-white/90 rounded-full p-4 shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-700">
              <path fill="currentColor" d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified physics canvas for basic animations
 */
export function SimplePhysicsCanvas({
  svgCode,
  className = '',
  width = 400,
  height = 300
}: {
  svgCode: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  // Sanitize SVG and CSS content for XSS prevention
  const sanitizedCSS = useMemo(() => sanitizeCSS(generateCSSAnimations()), []);
  const sanitizedSVG = useMemo(() => sanitizeSVG(svgCode), [svgCode]);

  return (
    <div 
      className={`simple-physics-canvas overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <style dangerouslySetInnerHTML={{ __html: sanitizedCSS }} />
      <div 
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: sanitizedSVG }}
      />
    </div>
  );
}

export default PhysicsCanvas;

