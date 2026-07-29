/**
 * Element Physics Service
 * 
 * Applies physics properties to SVG elements.
 * Bridges SVG illustrations with Matter.js physics engine.
 */

import { MatterClient, PhysicsBodyConfig } from './matter-client';
import { PhysicsPreset, getAnimationForElement, AnimationConfig, AnimationType } from './physics-presets';
import { ElementPhysics, SVGElementData } from '../api/anthropic-client';

export interface ElementPhysicsState {
  id: string;
  x: number;
  y: number;
  angle: number;
  scale: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
}

export interface AnimatedElement {
  id: string;
  element: SVGElementData;
  physics: ElementPhysics;
  state: ElementPhysicsState;
  animationType?: AnimationType;
  animationConfig?: AnimationConfig;
  animationProgress: number;
}

/**
 * Element Physics Manager
 * Manages physics for all SVG elements
 */
export class ElementPhysicsManager {
  private matterClient: MatterClient;
  private elements: Map<string, AnimatedElement> = new Map();
  private preset: PhysicsPreset | null = null;
  private time: number = 0;
  private isRunning: boolean = false;

  constructor(matterClient: MatterClient) {
    this.matterClient = matterClient;
  }

  /**
   * Initialize with a physics preset
   */
  async initialize(preset: PhysicsPreset): Promise<void> {
    this.preset = preset;
    
    await this.matterClient.init({
      width: 400,
      height: 300,
      gravity: preset.world.gravity
    });
  }

  /**
   * Add an SVG element with physics
   */
  addElement(
    svgElement: SVGElementData,
    physics: ElementPhysics,
    position: { x: number; y: number },
    dimensions: { width: number; height: number }
  ): AnimatedElement {
    // Create physics body
    const bodyConfig: PhysicsBodyConfig = {
      id: svgElement.id,
      type: physics.shape === 'circle' ? 'circle' : 'rectangle',
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height,
      radius: Math.min(dimensions.width, dimensions.height) / 2,
      isStatic: physics.bodyType === 'static',
      label: svgElement.label || svgElement.id,
      friction: this.preset?.defaultBodyOptions.friction ?? 0.2,
      restitution: this.preset?.defaultBodyOptions.restitution ?? 0.4,
      density: this.preset?.defaultBodyOptions.density ?? 0.001
    };

    this.matterClient.createBody(bodyConfig);

    // Get animation from preset
    let animationType: AnimationType | undefined;
    let animationConfig: AnimationConfig | undefined;

    if (physics.animation) {
      animationType = physics.animation.type as AnimationType;
      animationConfig = {
        speed: physics.animation.speed,
        target: physics.animation.target,
        loop: true
      };
    } else if (this.preset) {
      const presetAnimation = getAnimationForElement(svgElement.id, this.preset);
      if (presetAnimation) {
        animationType = presetAnimation.type;
        animationConfig = presetAnimation.config;
      }
    }

    // Create animated element
    const animatedElement: AnimatedElement = {
      id: svgElement.id,
      element: svgElement,
      physics,
      state: {
        id: svgElement.id,
        x: position.x,
        y: position.y,
        angle: 0,
        scale: 1,
        opacity: 1,
        velocityX: 0,
        velocityY: 0
      },
      animationType,
      animationConfig,
      animationProgress: 0
    };

    this.elements.set(svgElement.id, animatedElement);
    return animatedElement;
  }

  /**
   * Remove an element
   */
  removeElement(id: string): void {
    this.matterClient.removeBody(id);
    this.elements.delete(id);
  }

  /**
   * Update all elements
   */
  update(deltaTime: number): Map<string, ElementPhysicsState> {
    this.time += deltaTime;
    const states = new Map<string, ElementPhysicsState>();

    for (const [id, element] of this.elements) {
      // Get physics body state
      const body = this.matterClient.getBody(id);
      
      if (body) {
        element.state.x = body.position.x;
        element.state.y = body.position.y;
        element.state.angle = body.angle;
        element.state.velocityX = body.velocity.x;
        element.state.velocityY = body.velocity.y;
      }

      // Apply custom animation
      if (element.animationType && element.animationConfig) {
        this.applyAnimation(element, deltaTime);
      }

      states.set(id, { ...element.state });
    }

    return states;
  }

  /**
   * Apply animation to element
   */
  private applyAnimation(element: AnimatedElement, deltaTime: number): void {
    const config = element.animationConfig!;
    const speed = config.speed ?? 1;
    element.animationProgress += deltaTime * speed * 0.001;

    switch (element.animationType) {
      case 'pulse':
        this.applyPulse(element);
        break;
      case 'orbit':
        this.applyOrbit(element);
        break;
      case 'rotate':
        this.applyRotate(element);
        break;
      case 'float':
        this.applyFloat(element);
        break;
      case 'flow':
        this.applyFlow(element);
        break;
      case 'bounce':
        this.applyBounce(element);
        break;
      case 'shake':
        this.applyShake(element);
        break;
      case 'fadeInOut':
        this.applyFadeInOut(element);
        break;
      case 'wave':
        this.applyWave(element);
        break;
    }
  }

  private applyPulse(element: AnimatedElement): void {
    const amplitude = element.animationConfig?.amplitude ?? 0.1;
    const scale = 1 + Math.sin(element.animationProgress * Math.PI * 2) * amplitude;
    element.state.scale = scale;
  }

  private applyOrbit(element: AnimatedElement): void {
    const targetId = element.animationConfig?.target;
    const target = targetId ? this.elements.get(targetId) : null;
    
    if (target) {
      const radius = Math.sqrt(
        Math.pow(element.state.x - target.state.x, 2) +
        Math.pow(element.state.y - target.state.y, 2)
      ) || 50;
      
      element.state.x = target.state.x + Math.cos(element.animationProgress) * radius;
      element.state.y = target.state.y + Math.sin(element.animationProgress) * radius;
      
      this.matterClient.setPosition(element.id, element.state.x, element.state.y);
    } else {
      // Orbit around initial position
      const radius = 30;
      const centerX = element.physics.animation?.target ? 200 : element.state.x;
      const centerY = element.physics.animation?.target ? 150 : element.state.y;
      
      element.state.x = centerX + Math.cos(element.animationProgress) * radius;
      element.state.y = centerY + Math.sin(element.animationProgress) * radius;
      
      this.matterClient.setPosition(element.id, element.state.x, element.state.y);
    }
  }

  private applyRotate(element: AnimatedElement): void {
    element.state.angle = element.animationProgress;
    this.matterClient.setAngle(element.id, element.state.angle);
  }

  private applyFloat(element: AnimatedElement): void {
    const amplitude = element.animationConfig?.amplitude ?? 10;
    const offset = Math.sin(element.animationProgress * Math.PI * 2) * amplitude;
    element.state.y += offset * 0.01;
  }

  private applyFlow(element: AnimatedElement): void {
    const direction = element.animationConfig?.direction ?? 'down';
    const speed = element.animationConfig?.speed ?? 1;
    
    switch (direction) {
      case 'up':
        element.state.y -= speed * 0.5;
        break;
      case 'down':
        element.state.y += speed * 0.5;
        break;
      case 'left':
        element.state.x -= speed * 0.5;
        break;
      case 'right':
        element.state.x += speed * 0.5;
        break;
    }
    
    this.matterClient.setPosition(element.id, element.state.x, element.state.y);
  }

  private applyBounce(element: AnimatedElement): void {
    const amplitude = element.animationConfig?.amplitude ?? 5;
    const bounce = Math.abs(Math.sin(element.animationProgress * Math.PI * 2)) * amplitude;
    element.state.y -= bounce * 0.1;
  }

  private applyShake(element: AnimatedElement): void {
    const amplitude = element.animationConfig?.amplitude ?? 2;
    element.state.x += Math.sin(element.animationProgress * 20) * amplitude * 0.1;
  }

  private applyFadeInOut(element: AnimatedElement): void {
    element.state.opacity = 0.5 + Math.sin(element.animationProgress * Math.PI * 2) * 0.5;
  }

  private applyWave(element: AnimatedElement): void {
    const amplitude = element.animationConfig?.amplitude ?? 10;
    element.state.y += Math.sin(element.animationProgress * Math.PI * 2 + element.state.x * 0.05) * amplitude * 0.01;
  }

  /**
   * Get current state of all elements
   */
  getStates(): Map<string, ElementPhysicsState> {
    const states = new Map<string, ElementPhysicsState>();
    for (const [id, element] of this.elements) {
      states.set(id, { ...element.state });
    }
    return states;
  }

  /**
   * Get state of specific element
   */
  getState(id: string): ElementPhysicsState | undefined {
    return this.elements.get(id)?.state;
  }

  /**
   * Start physics simulation
   */
  start(): void {
    this.isRunning = true;
    this.matterClient.start();
  }

  /**
   * Stop physics simulation
   */
  stop(): void {
    this.isRunning = false;
    this.matterClient.stop();
  }

  /**
   * Clear all elements
   */
  clear(): void {
    this.elements.clear();
    this.matterClient.clear();
    this.time = 0;
  }

  /**
   * Check if running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get current time
   */
  get currentTime(): number {
    return this.time;
  }
}

/**
 * Parse SVG to extract element positions and dimensions
 */
export function parseSVGElementBounds(
  svg: string,
  elementId: string
): { x: number; y: number; width: number; height: number } | null {
  // Default bounds
  const defaultBounds = { x: 200, y: 150, width: 50, height: 50 };

  // Try to find element in SVG
  const regex = new RegExp(`<[^>]*id=["']${elementId}["'][^>]*>`, 'i');
  const match = svg.match(regex);
  
  if (!match) return defaultBounds;

  const element = match[0];

  // Parse based on element type
  if (element.includes('<circle')) {
    const cx = parseFloat(element.match(/cx=["']([^"']+)["']/)?.[1] || '200');
    const cy = parseFloat(element.match(/cy=["']([^"']+)["']/)?.[1] || '150');
    const r = parseFloat(element.match(/r=["']([^"']+)["']/)?.[1] || '25');
    return { x: cx, y: cy, width: r * 2, height: r * 2 };
  }

  if (element.includes('<rect')) {
    const x = parseFloat(element.match(/x=["']([^"']+)["']/)?.[1] || '175');
    const y = parseFloat(element.match(/y=["']([^"']+)["']/)?.[1] || '125');
    const width = parseFloat(element.match(/width=["']([^"']+)["']/)?.[1] || '50');
    const height = parseFloat(element.match(/height=["']([^"']+)["']/)?.[1] || '50');
    return { x: x + width / 2, y: y + height / 2, width, height };
  }

  if (element.includes('<ellipse')) {
    const cx = parseFloat(element.match(/cx=["']([^"']+)["']/)?.[1] || '200');
    const cy = parseFloat(element.match(/cy=["']([^"']+)["']/)?.[1] || '150');
    const rx = parseFloat(element.match(/rx=["']([^"']+)["']/)?.[1] || '40');
    const ry = parseFloat(element.match(/ry=["']([^"']+)["']/)?.[1] || '25');
    return { x: cx, y: cy, width: rx * 2, height: ry * 2 };
  }

  return defaultBounds;
}

/**
 * Create physics manager
 */
export function createElementPhysicsManager(matterClient: MatterClient): ElementPhysicsManager {
  return new ElementPhysicsManager(matterClient);
}

// Default export
export default {
  ElementPhysicsManager,
  createElementPhysicsManager,
  parseSVGElementBounds
};

