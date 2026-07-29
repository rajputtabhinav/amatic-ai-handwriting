/**
 * Particle System
 * 
 * Creates particle effects for flows, emissions, and visual effects.
 * Generates SVG particles with physics properties.
 */

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  angle: number;
  angularVelocity: number;
}

export interface ParticleEmitterConfig {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rate: number; // particles per second
  maxParticles: number;
  particleConfig: ParticleConfig;
  direction: EmitterDirection;
  spread: number; // angle spread in radians
  enabled: boolean;
}

export interface ParticleConfig {
  size: number | [number, number]; // single or range
  speed: number | [number, number];
  life: number | [number, number]; // in milliseconds
  color: string | string[];
  fadeOut: boolean;
  shrink: boolean;
  gravity: number;
  friction: number;
}

export type EmitterDirection = 
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'outward'
  | 'inward'
  | { x: number; y: number };

/**
 * Particle System Manager
 */
export class ParticleSystem {
  private particles: Map<string, Particle> = new Map();
  private emitters: Map<string, ParticleEmitter> = new Map();
  private particleIdCounter: number = 0;
  private isRunning: boolean = false;

  /**
   * Create a new particle emitter
   */
  createEmitter(config: ParticleEmitterConfig): ParticleEmitter {
    const emitter = new ParticleEmitter(config, this);
    this.emitters.set(config.id, emitter);
    return emitter;
  }

  /**
   * Remove an emitter
   */
  removeEmitter(id: string): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.clear();
      this.emitters.delete(id);
    }
  }

  /**
   * Get emitter by ID
   */
  getEmitter(id: string): ParticleEmitter | undefined {
    return this.emitters.get(id);
  }

  /**
   * Add a particle
   */
  addParticle(particle: Particle): void {
    this.particles.set(particle.id, particle);
  }

  /**
   * Remove a particle
   */
  removeParticle(id: string): void {
    this.particles.delete(id);
  }

  /**
   * Generate unique particle ID
   */
  generateParticleId(): string {
    return `particle-${++this.particleIdCounter}`;
  }

  /**
   * Update all particles and emitters
   */
  update(deltaTime: number): void {
    // Update emitters
    for (const emitter of this.emitters.values()) {
      emitter.update(deltaTime);
    }

    // Update particles
    const deadParticles: string[] = [];
    
    for (const [id, particle] of this.particles) {
      // Update life
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        deadParticles.push(id);
        continue;
      }

      // Update position
      particle.x += particle.vx * deltaTime * 0.001;
      particle.y += particle.vy * deltaTime * 0.001;
      particle.angle += particle.angularVelocity * deltaTime * 0.001;
    }

    // Remove dead particles
    for (const id of deadParticles) {
      this.particles.delete(id);
    }
  }

  /**
   * Get all particles
   */
  getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  /**
   * Get particle count
   */
  get particleCount(): number {
    return this.particles.size;
  }

  /**
   * Start the particle system
   */
  start(): void {
    this.isRunning = true;
    
    for (const emitter of this.emitters.values()) {
      emitter.start();
    }
  }

  /**
   * Stop the particle system
   */
  stop(): void {
    this.isRunning = false;
    
    for (const emitter of this.emitters.values()) {
      emitter.stop();
    }
  }

  /**
   * Clear all particles and emitters
   */
  clear(): void {
    this.particles.clear();
    this.emitters.clear();
    this.particleIdCounter = 0;
  }

  /**
   * Generate SVG for particles
   */
  generateSVG(): string {
    const particles = this.getParticles();
    
    if (particles.length === 0) return '';

    const particleSVGs = particles.map(p => {
      const lifeRatio = p.life / p.maxLife;
      const opacity = p.opacity * (lifeRatio > 0.2 ? 1 : lifeRatio / 0.2);
      const size = p.size * (lifeRatio > 0.3 ? 1 : 0.5 + lifeRatio / 0.6);
      
      return `<circle 
        id="${p.id}" 
        cx="${p.x.toFixed(1)}" 
        cy="${p.y.toFixed(1)}" 
        r="${size.toFixed(1)}" 
        fill="${p.color}" 
        opacity="${opacity.toFixed(2)}"
        transform="rotate(${(p.angle * 180 / Math.PI).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})"
      />`;
    }).join('\n');

    return `<g id="particles">${particleSVGs}</g>`;
  }

  /**
   * Check if running
   */
  get running(): boolean {
    return this.isRunning;
  }
}

/**
 * Particle Emitter
 */
export class ParticleEmitter {
  private config: ParticleEmitterConfig;
  private system: ParticleSystem;
  private timeSinceEmission: number = 0;
  private particleIds: Set<string> = new Set();
  private enabled: boolean;

  constructor(config: ParticleEmitterConfig, system: ParticleSystem) {
    this.config = config;
    this.system = system;
    this.enabled = config.enabled;
  }

  /**
   * Update emitter and emit particles
   */
  update(deltaTime: number): void {
    if (!this.enabled) return;

    this.timeSinceEmission += deltaTime;
    
    const emissionInterval = 1000 / this.config.rate;
    
    while (this.timeSinceEmission >= emissionInterval) {
      if (this.particleIds.size < this.config.maxParticles) {
        this.emit();
      }
      this.timeSinceEmission -= emissionInterval;
    }

    // Clean up dead particles
    const deadParticles: string[] = [];
    for (const id of this.particleIds) {
      if (!this.system.getParticles().some(p => p.id === id)) {
        deadParticles.push(id);
      }
    }
    for (const id of deadParticles) {
      this.particleIds.delete(id);
    }
  }

  /**
   * Emit a single particle
   */
  emit(): Particle {
    const config = this.config.particleConfig;
    const id = this.system.generateParticleId();
    
    // Calculate spawn position
    const x = this.config.x + (this.config.width ? (Math.random() - 0.5) * this.config.width : 0);
    const y = this.config.y + (this.config.height ? (Math.random() - 0.5) * this.config.height : 0);
    
    // Calculate velocity
    const speed = this.randomRange(config.speed);
    const baseAngle = this.getDirectionAngle();
    const angle = baseAngle + (Math.random() - 0.5) * this.config.spread;
    
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // Create particle
    const particle: Particle = {
      id,
      x,
      y,
      vx,
      vy,
      size: this.randomRange(config.size),
      color: this.randomColor(config.color),
      opacity: 1,
      life: this.randomRange(config.life),
      maxLife: this.randomRange(config.life),
      angle: 0,
      angularVelocity: (Math.random() - 0.5) * 2
    };

    this.system.addParticle(particle);
    this.particleIds.add(id);
    
    return particle;
  }

  /**
   * Get direction angle in radians
   */
  private getDirectionAngle(): number {
    const dir = this.config.direction;
    
    if (typeof dir === 'object') {
      return Math.atan2(dir.y, dir.x);
    }

    switch (dir) {
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
      case 'left': return Math.PI;
      case 'right': return 0;
      case 'outward': return Math.random() * Math.PI * 2;
      case 'inward': return Math.random() * Math.PI * 2 + Math.PI;
      default: return -Math.PI / 2;
    }
  }

  /**
   * Get random value from range
   */
  private randomRange(value: number | [number, number]): number {
    if (Array.isArray(value)) {
      return value[0] + Math.random() * (value[1] - value[0]);
    }
    return value;
  }

  /**
   * Get random color from options
   */
  private randomColor(color: string | string[]): string {
    if (Array.isArray(color)) {
      return color[Math.floor(Math.random() * color.length)];
    }
    return color;
  }

  /**
   * Start emitting
   */
  start(): void {
    this.enabled = true;
  }

  /**
   * Stop emitting
   */
  stop(): void {
    this.enabled = false;
  }

  /**
   * Clear all particles from this emitter
   */
  clear(): void {
    for (const id of this.particleIds) {
      this.system.removeParticle(id);
    }
    this.particleIds.clear();
  }

  /**
   * Update emitter position
   */
  setPosition(x: number, y: number): void {
    this.config.x = x;
    this.config.y = y;
  }

  /**
   * Get current particle count
   */
  get particleCount(): number {
    return this.particleIds.size;
  }
}

/**
 * Preset particle configurations
 */
export const PARTICLE_PRESETS = {
  sunlight: {
    size: [2, 4],
    speed: [20, 40],
    life: [2000, 3000],
    color: ['#FFD700', '#FFA500', '#FFFF00'],
    fadeOut: true,
    shrink: true,
    gravity: 0.5,
    friction: 0.01
  },
  water: {
    size: [3, 6],
    speed: [10, 30],
    life: [1500, 2500],
    color: ['#1E90FF', '#00BFFF', '#87CEEB'],
    fadeOut: true,
    shrink: false,
    gravity: 1,
    friction: 0.02
  },
  oxygen: {
    size: [4, 8],
    speed: [15, 25],
    life: [3000, 5000],
    color: ['#FFFFFF', '#E0FFFF', '#F0FFFF'],
    fadeOut: true,
    shrink: false,
    gravity: -0.3,
    friction: 0.01
  },
  blood: {
    size: [3, 5],
    speed: [30, 50],
    life: [2000, 3500],
    color: ['#DC143C', '#B22222', '#8B0000'],
    fadeOut: true,
    shrink: true,
    gravity: 0,
    friction: 0.02
  },
  data: {
    size: [2, 3],
    speed: [50, 80],
    life: [1000, 2000],
    color: ['#00FF00', '#32CD32', '#7FFF00'],
    fadeOut: true,
    shrink: false,
    gravity: 0,
    friction: 0
  },
  spark: {
    size: [1, 3],
    speed: [40, 80],
    life: [500, 1000],
    color: ['#FFD700', '#FF6347', '#FF4500'],
    fadeOut: true,
    shrink: true,
    gravity: 0.5,
    friction: 0.05
  }
} as const;

/**
 * Create a particle system
 */
export function createParticleSystem(): ParticleSystem {
  return new ParticleSystem();
}

// Default export
export default {
  ParticleSystem,
  ParticleEmitter,
  createParticleSystem,
  PARTICLE_PRESETS
};

