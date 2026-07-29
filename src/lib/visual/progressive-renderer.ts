/**
 * Progressive SVG Renderer
 * 
 * Manages animated addition of SVG elements to the canvas
 * with staggered timing and smooth fade-in effects.
 */

import type { CanvasElement } from '@/stores/canvas-store';

// Type definitions (replace svg-parser-streaming)
export interface ParsedSVGElement {
  id: string;
  type: string;
  label?: string;
}

function parsedElementToCanvasProps(_element: ParsedSVGElement): Partial<CanvasElement> {
  // Stub function - not needed for React components
  return {};
}

export interface RenderQueueItem {
  element: ParsedSVGElement;
  canvasElement: CanvasElement | null;
  status: 'pending' | 'rendering' | 'complete';
  addedAt?: number;
}

export interface ProgressiveRendererState {
  queue: RenderQueueItem[];
  isRendering: boolean;
  currentIndex: number;
  offsetX: number;
  offsetY: number;
}

export interface ProgressiveRendererCallbacks {
  onElementReady: (element: CanvasElement) => void;
  onRenderComplete: () => void;
  onProgress: (current: number, total: number) => void;
}

/**
 * Create initial renderer state
 */
export function createRendererState(offsetX = 200, offsetY = 150): ProgressiveRendererState {
  return {
    queue: [],
    isRendering: false,
    currentIndex: 0,
    offsetX,
    offsetY,
  };
}

/**
 * Convert ParsedSVGElement to CanvasElement
 */
function createCanvasElement(
  parsed: ParsedSVGElement,
  offsetX: number,
  offsetY: number
): CanvasElement | null {
  const props = parsedElementToCanvasProps(parsed, undefined, offsetX, offsetY);
  if (!props) return null;
  
  const baseElement: Partial<CanvasElement> = {
    id: `progressive-${parsed.id}`,
    x: props.x,
    y: props.y,
    width: props.width || 100,
    height: props.height || 100,
    opacity: 1,
    color: props.stroke || '#000000',
    fill: props.fill || 'transparent',
    strokeWidth: props.strokeWidth || 2,
    roughness: 0, // Clean rendering for AI elements
    fillStyle: 'solid',
  };
  
  switch (props.type) {
    case 'rectangle':
      return {
        ...baseElement,
        type: 'rectangle',
      } as CanvasElement;
      
    case 'circle':
    case 'ellipse':
      return {
        ...baseElement,
        type: 'circle',
      } as CanvasElement;
      
    case 'line':
      return {
        ...baseElement,
        type: 'arrow',
        points: props.points,
      } as CanvasElement;
      
    case 'path':
      // Convert path to freedraw points (simplified)
      return {
        ...baseElement,
        type: 'pen',
        points: [{ x: props.x, y: props.y }],
        path: props.path,
      } as CanvasElement;
      
    case 'text':
      return {
        ...baseElement,
        type: 'text',
        text: props.text || '',
        fontSize: 16,
        fontFamily: 'Inter',
      } as CanvasElement;
      
    case 'polygon':
    case 'polyline':
      return {
        ...baseElement,
        type: 'pen',
        points: props.points || [],
      } as CanvasElement;
      
    default:
      return null;
  }
}

/**
 * Add elements to render queue
 */
export function addToQueue(
  state: ProgressiveRendererState,
  elements: ParsedSVGElement[]
): ProgressiveRendererState {
  const newItems: RenderQueueItem[] = elements.map(element => ({
    element,
    canvasElement: createCanvasElement(element, state.offsetX, state.offsetY),
    status: 'pending' as const,
  }));
  
  return {
    ...state,
    queue: [...state.queue, ...newItems],
  };
}

/**
 * Start progressive rendering with animation
 */
export function startProgressiveRender(
  state: ProgressiveRendererState,
  callbacks: ProgressiveRendererCallbacks,
  options: {
    staggerDelay?: number;  // ms between elements
  } = {}
): { stop: () => void } {
  const { staggerDelay = 150 } = options;
  
  let currentIndex = state.currentIndex;
  let isRunning = true;
  let timeoutId: NodeJS.Timeout | null = null;
  
  const processNext = () => {
    if (!isRunning) return;
    
    const item = state.queue[currentIndex];
    if (!item) {
      callbacks.onRenderComplete();
      return;
    }
    
    if (item.canvasElement) {
      // Create element with fade-in animation
      const elementWithAnimation: CanvasElement = {
        ...item.canvasElement,
        opacity: 1, // Final opacity
      };
      
      callbacks.onElementReady(elementWithAnimation);
      callbacks.onProgress(currentIndex + 1, state.queue.length);
    }
    
    currentIndex++;
    
    if (currentIndex < state.queue.length) {
      timeoutId = setTimeout(processNext, staggerDelay);
    } else {
      callbacks.onRenderComplete();
    }
  };
  
  // Start processing
  processNext();
  
  return {
    stop: () => {
      isRunning = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}

/**
 * Progressive renderer class for easier state management
 */
export class ProgressiveRenderer {
  private state: ProgressiveRendererState;
  private callbacks: ProgressiveRendererCallbacks | null = null;
  private stopFn: (() => void) | null = null;
  private staggerDelay: number;
  
  constructor(offsetX = 200, offsetY = 150, staggerDelay = 150) {
    this.state = createRendererState(offsetX, offsetY);
    this.staggerDelay = staggerDelay;
  }
  
  /**
   * Set callbacks for render events
   */
  setCallbacks(callbacks: ProgressiveRendererCallbacks): void {
    this.callbacks = callbacks;
  }
  
  /**
   * Add parsed elements to the queue
   */
  addElements(elements: ParsedSVGElement[]): void {
    this.state = addToQueue(this.state, elements);
    
    // Auto-start if callbacks are set and not already rendering
    if (this.callbacks && !this.state.isRendering) {
      this.startRender();
    }
  }
  
  /**
   * Start rendering queued elements
   */
  startRender(): void {
    if (!this.callbacks || this.state.isRendering) return;
    
    this.state.isRendering = true;
    
    const { stop } = startProgressiveRender(
      this.state,
      {
        ...this.callbacks,
        onRenderComplete: () => {
          this.state.isRendering = false;
          this.callbacks?.onRenderComplete();
        },
      },
      { staggerDelay: this.staggerDelay }
    );
    
    this.stopFn = stop;
  }
  
  /**
   * Stop rendering
   */
  stop(): void {
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }
    this.state.isRendering = false;
  }
  
  /**
   * Reset renderer state
   */
  reset(offsetX?: number, offsetY?: number): void {
    this.stop();
    this.state = createRendererState(
      offsetX ?? this.state.offsetX,
      offsetY ?? this.state.offsetY
    );
  }
  
  /**
   * Update render position offset
   */
  setOffset(x: number, y: number): void {
    this.state.offsetX = x;
    this.state.offsetY = y;
  }
  
  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.state.queue.length;
  }
  
  /**
   * Check if currently rendering
   */
  isRendering(): boolean {
    return this.state.isRendering;
  }
}

/**
 * Create a singleton progressive renderer instance
 */
let rendererInstance: ProgressiveRenderer | null = null;

export function getProgressiveRenderer(): ProgressiveRenderer {
  if (!rendererInstance) {
    rendererInstance = new ProgressiveRenderer();
  }
  return rendererInstance;
}

export function resetProgressiveRenderer(): void {
  if (rendererInstance) {
    rendererInstance.reset();
  }
  rendererInstance = null;
}

