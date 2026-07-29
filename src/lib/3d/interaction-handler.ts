/**
 * Spatial Interaction Handler
 * 
 * Manages 3D interactions: rotate, zoom, manipulate objects.
 * Provides AI narration based on user exploration.
 */

import * as THREE from 'three';

export interface InteractionConfig {
  enableRotation: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  enableObjectManipulation: boolean;
  enableSelection: boolean;
}

export interface SpatialEvent {
  type: 'rotate' | 'zoom' | 'pan' | 'select' | 'drag';
  target?: string;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  timestamp: number;
}

export interface CameraView {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  zoom: number;
}

/**
 * Spatial Interaction Handler
 */
export class SpatialInteractionHandler {
  private config: InteractionConfig;
  private selectedObject: THREE.Object3D | null = null;
  private isDragging: boolean = false;
  private dragStart: THREE.Vector3 | null = null;
  private onInteraction?: (event: SpatialEvent) => void;
  private onNarrationNeeded?: (object: THREE.Object3D, view: CameraView) => Promise<void>;

  constructor(
    config: InteractionConfig = {
      enableRotation: true,
      enableZoom: true,
      enablePan: true,
      enableObjectManipulation: false,
      enableSelection: true,
    }
  ) {
    this.config = config;
  }

  /**
   * Set interaction callback
   */
  setOnInteraction(callback: (event: SpatialEvent) => void): void {
    this.onInteraction = callback;
  }

  /**
   * Set narration callback
   */
  setOnNarrationNeeded(
    callback: (object: THREE.Object3D, view: CameraView) => Promise<void>
  ): void {
    this.onNarrationNeeded = callback;
  }

  /**
   * Enable object manipulation (drag, rotate individual objects)
   */
  enableObjectManipulation(object: THREE.Object3D): void {
    if (!this.config.enableObjectManipulation) return;

    // Store original position for reset
    const originalPosition = object.position.clone();

    // Make object interactive
    object.userData.interactive = true;
    object.userData.originalPosition = originalPosition;

    // Add event listeners (handled by Three.js event system)
    (object as unknown as {
      addEventListener: (type: string, handler: (event: unknown) => void) => void;
    }).addEventListener('pointerdown', (event: unknown) => {
      this.startDrag(event, object);
    });

    (object as unknown as {
      addEventListener: (type: string, handler: (event: unknown) => void) => void;
    }).addEventListener('pointermove', (event: unknown) => {
      if (this.isDragging && this.selectedObject === object) {
        this.updateDragPosition(event, object);
      }
    });

    (object as unknown as {
      addEventListener: (type: string, handler: () => void) => void;
    }).addEventListener('pointerup', () => {
      this.endDrag();
    });
  }

  /**
   * Start dragging object
   */
  private startDrag(_event: unknown, object: THREE.Object3D): void {
    this.isDragging = true;
    this.selectedObject = object;
    this.dragStart = object.position.clone();

    this.emitEvent({
      type: 'drag',
      target: object.name || object.uuid,
      position: object.position,
      timestamp: Date.now(),
    });
  }

  /**
   * Update drag position
   */
  private updateDragPosition(event: any, object: THREE.Object3D): void {
    if (!this.isDragging || !this.dragStart) return;

    // Calculate new position based on mouse movement
    // This is simplified - real implementation would use raycasting
    const delta = new THREE.Vector3(
      event.movementX * 0.01,
      -event.movementY * 0.01,
      0
    );

    object.position.add(delta);
  }

  /**
   * End dragging
   */
  private endDrag(): void {
    this.isDragging = false;
    this.dragStart = null;
  }

  /**
   * Handle object selection
   */
  selectObject(object: THREE.Object3D, camera: THREE.Camera): void {
    if (!this.config.enableSelection) return;

    this.selectedObject = object;

    this.emitEvent({
      type: 'select',
      target: object.name || object.uuid,
      position: object.position,
      timestamp: Date.now(),
    });

    // Trigger narration if callback is set
    if (this.onNarrationNeeded) {
      const view: CameraView = {
        position: camera.position.clone(),
        rotation: camera.rotation.clone(),
        zoom: (camera as any).zoom || 1,
      };

      this.onNarrationNeeded(object, view);
    }
  }

  /**
   * Emit interaction event
   */
  private emitEvent(event: SpatialEvent): void {
    this.onInteraction?.(event);
  }

  /**
   * Get selected object
   */
  getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedObject = null;
  }

  /**
   * Reset all objects to original positions
   */
  resetScene(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object.userData.originalPosition) {
        object.position.copy(object.userData.originalPosition);
      }
    });

    this.clearSelection();
  }
}

/**
 * Generate narration for 3D exploration
 */
export async function generateExplorationNarration(
  objectName: string,
  _objectType: string,
  _view: CameraView,
  concept: string
): Promise<string> {
  // Simple narration generation (can be enhanced with AI)
  const narrations = [
    `This is the ${objectName}. Notice its position and structure.`,
    `The ${objectName} is a key component of ${concept}.`,
    `From this angle, you can see how ${objectName} connects to other parts.`,
    `${objectName} plays an important role in understanding ${concept}.`,
  ];

  return narrations[Math.floor(Math.random() * narrations.length)];
}

/**
 * Create interaction handler with AI narration
 */
export function createInteractionHandler(
  config?: InteractionConfig,
  onNarration?: (text: string) => Promise<void>
): SpatialInteractionHandler {
  const handler = new SpatialInteractionHandler(config);

  if (onNarration) {
    handler.setOnNarrationNeeded(async (object, view) => {
      const narration = await generateExplorationNarration(
        object.name || 'object',
        object.type,
        view,
        'this concept'
      );
      await onNarration(narration);
    });
  }

  return handler;
}

export default {
  SpatialInteractionHandler,
  createInteractionHandler,
  generateExplorationNarration,
};

