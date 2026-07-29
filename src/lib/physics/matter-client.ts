/**
 * Matter.js Physics Engine Client
 * 
 * Wrapper for Matter.js physics engine.
 * Manages physics world, bodies, and animations.
 */

import type * as MatterTypes from 'matter-js';

// Re-export Matter.js types with local aliases for convenience
type MatterEngine = MatterTypes.Engine;
type MatterBody = MatterTypes.Body;

// Local vector interface for API consistency
interface Vector {
  x: number;
  y: number;
}

// Simplified body interface for external use
interface PhysicsBody {
  id: number;
  label: string;
  position: Vector;
  velocity: Vector;
  angle: number;
  angularVelocity: number;
  isStatic: boolean;
  isSensor: boolean;
  render: {
    visible: boolean;
    opacity: number;
  };
}

// We'll dynamically import Matter.js for SSR compatibility
let Matter: typeof MatterTypes | null = null;

/**
 * Physics world configuration
 */
export interface PhysicsWorldConfig {
  width: number;
  height: number;
  gravity?: Vector;
  enableSleeping?: boolean;
  wireframes?: boolean;
}

/**
 * Physics body configuration
 */
export interface PhysicsBodyConfig {
  id: string;
  type: 'circle' | 'rectangle' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  isStatic?: boolean;
  isSensor?: boolean;
  label?: string;
  angle?: number;
  friction?: number;
  restitution?: number;
  density?: number;
}

/**
 * Matter.js Physics Client
 */
export class MatterClient {
  private engine: MatterEngine | null = null;
  private bodies: Map<string, MatterBody> = new Map();
  private isInitialized = false;
  private animationFrameId: number | null = null;
  private updateCallbacks: Set<(delta: number) => void> = new Set();

  constructor() {
    // Initialize on client side only
    if (typeof window !== 'undefined') {
      this.loadMatter();
    }
  }

  /**
   * Load Matter.js dynamically (for SSR compatibility)
   */
  private async loadMatter(): Promise<void> {
    if (!Matter) {
      Matter = await import('matter-js');
    }
  }

  /**
   * Initialize physics world
   */
  async init(config: PhysicsWorldConfig): Promise<void> {
    await this.loadMatter();
    if (!Matter) throw new Error('Matter.js not loaded');

    const { Engine } = Matter;

    // Create engine
    this.engine = Engine.create({
      enableSleeping: config.enableSleeping ?? false
    });

    // Set gravity
    if (config.gravity) {
      this.engine.world.gravity.x = config.gravity.x;
      this.engine.world.gravity.y = config.gravity.y;
    }

    this.isInitialized = true;
  }

  /**
   * Create a physics body
   */
  createBody(config: PhysicsBodyConfig): PhysicsBody | null {
    if (!Matter || !this.engine) return null;

    const { Bodies, World } = Matter;
    let body: MatterBody;

    const options = {
      isStatic: config.isStatic ?? false,
      isSensor: config.isSensor ?? false,
      label: config.label || config.id,
      angle: config.angle ?? 0,
      friction: config.friction ?? 0.1,
      restitution: config.restitution ?? 0.5,
      density: config.density ?? 0.001,
      render: {
        visible: true,
        opacity: 1
      }
    };

    switch (config.type) {
      case 'circle':
        body = Bodies.circle(
          config.x,
          config.y,
          config.radius || 20,
          options
        );
        break;
      case 'rectangle':
        body = Bodies.rectangle(
          config.x,
          config.y,
          config.width || 50,
          config.height || 50,
          options
        );
        break;
      case 'polygon':
        body = Bodies.polygon(
          config.x,
          config.y,
          6, // hexagon by default
          config.radius || 20,
          options
        );
        break;
      default:
        body = Bodies.circle(config.x, config.y, 20, options);
    }

    // Store reference
    this.bodies.set(config.id, body);

    // Add to world
    World.add(this.engine.world, body);

    return this.toPhysicsBody(body);
  }

  /**
   * Convert Matter.js body to simplified PhysicsBody interface
   */
  private toPhysicsBody(body: MatterBody): PhysicsBody {
    return {
      id: body.id,
      label: body.label,
      position: { x: body.position.x, y: body.position.y },
      velocity: { x: body.velocity.x, y: body.velocity.y },
      angle: body.angle,
      angularVelocity: body.angularVelocity,
      isStatic: body.isStatic,
      isSensor: body.isSensor,
      render: {
        visible: body.render.visible ?? true,
        opacity: body.render.opacity ?? 1
      }
    };
  }

  /**
   * Remove a body from the world
   */
  removeBody(id: string): void {
    if (!Matter || !this.engine) return;

    const body = this.bodies.get(id);
    if (body) {
      Matter.World.remove(this.engine.world, body);
      this.bodies.delete(id);
    }
  }

  /**
   * Get body by ID
   */
  getBody(id: string): PhysicsBody | undefined {
    const body = this.bodies.get(id);
    return body ? this.toPhysicsBody(body) : undefined;
  }

  /**
   * Get all bodies
   */
  getAllBodies(): Map<string, PhysicsBody> {
    const result = new Map<string, PhysicsBody>();
    this.bodies.forEach((body, id) => {
      result.set(id, this.toPhysicsBody(body));
    });
    return result;
  }

  /**
   * Set body position
   */
  setPosition(id: string, x: number, y: number): void {
    if (!Matter) return;
    const body = this.bodies.get(id);
    if (body) {
      Matter.Body.setPosition(body, { x, y });
    }
  }

  /**
   * Set body velocity
   */
  setVelocity(id: string, x: number, y: number): void {
    if (!Matter) return;
    const body = this.bodies.get(id);
    if (body) {
      Matter.Body.setVelocity(body, { x, y });
    }
  }

  /**
   * Apply force to body
   */
  applyForce(id: string, force: Vector): void {
    if (!Matter) return;
    const body = this.bodies.get(id);
    if (body) {
      Matter.Body.applyForce(body, body.position, force);
    }
  }

  /**
   * Set body angle
   */
  setAngle(id: string, angle: number): void {
    if (!Matter) return;
    const body = this.bodies.get(id);
    if (body) {
      Matter.Body.setAngle(body, angle);
    }
  }

  /**
   * Rotate body
   */
  rotate(id: string, rotation: number): void {
    if (!Matter) return;
    const body = this.bodies.get(id);
    if (body) {
      Matter.Body.rotate(body, rotation);
    }
  }

  /**
   * Set world gravity
   */
  setGravity(x: number, y: number): void {
    if (this.engine) {
      this.engine.world.gravity.x = x;
      this.engine.world.gravity.y = y;
    }
  }

  /**
   * Start physics simulation
   */
  start(): void {
    if (!Matter || !this.engine) return;

    const update = () => {
      if (!this.engine || !Matter) return;

      // Update engine
      Matter.Engine.update(this.engine, 1000 / 60);

      // Call update callbacks
      this.updateCallbacks.forEach(callback => callback(1000 / 60));

      // Continue loop
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Stop physics simulation
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Step physics by one frame
   */
  step(delta: number = 1000 / 60): void {
    if (!Matter || !this.engine) return;
    Matter.Engine.update(this.engine, delta);
  }

  /**
   * Register update callback
   */
  onUpdate(callback: (delta: number) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Clear all bodies
   */
  clear(): void {
    if (!Matter || !this.engine) return;

    Matter.World.clear(this.engine.world, false);
    this.bodies.clear();
  }

  /**
   * Destroy engine
   */
  destroy(): void {
    this.stop();
    this.clear();
    this.engine = null;
    this.isInitialized = false;
    this.updateCallbacks.clear();
  }

  /**
   * Check if initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current timestamp
   */
  get timestamp(): number {
    return this.engine?.timing.timestamp ?? 0;
  }
}

/**
 * Create a new Matter client instance
 */
export function createMatterClient(): MatterClient {
  return new MatterClient();
}

/**
 * Singleton instance for global use
 */
let globalClient: MatterClient | null = null;

export function getMatterClient(): MatterClient {
  if (!globalClient) {
    globalClient = new MatterClient();
  }
  return globalClient;
}

// Default export
export default {
  MatterClient,
  createMatterClient,
  getMatterClient
};

