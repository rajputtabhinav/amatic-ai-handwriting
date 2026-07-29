/**
 * Replicate API Client
 * 
 * ⚠️ DEPRECATED - NO LONGER USED
 * All image generation now uses Google Gemini only.
 * This file can be deleted.
 */

// TODO: Install replicate package or remove this file
// import Replicate from 'replicate';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  negativePrompt?: string;
  outputFormat?: 'png' | 'webp' | 'jpg';
}

export interface Model3DOptions {
  artStyle?: 'realistic' | 'stylized' | 'low-poly';
  negativePrompt?: string;
  polyCount?: 'low' | 'medium' | 'high';
  format?: 'glb' | 'obj' | 'fbx';
}

export interface ImageResult {
  url: string;
  quality: number;
  model: string;
  generationTime: number;
}

export interface Model3DResult {
  glbUrl: string;
  objUrl?: string;
  quality: number;
  model: string;
  generationTime: number;
  polyCount?: number;
}

/**
 * Replicate Image Generation Client
 */
export class ReplicateImageClient {
  private replicate: any;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.REPLICATE_API_KEY || '';
    
    if (!key) {
      console.warn('[Replicate] No API key provided');
    }
    
    // TODO: Install replicate package or remove this deprecated client
    this.replicate = null;
  }
  
  /**
   * Generate image with Flux.1 Pro (backup for Nano Banana)
   */
  async generateFluxPro(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<ImageResult> {
    
    const startTime = Date.now();
    
    try {
      const output: any = await this.replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt,
            width: options.width || 1024,
            height: options.height || 1024,
            num_outputs: 1,
            output_format: options.outputFormat || 'png',
            guidance_scale: options.guidanceScale || 7.5,
            num_inference_steps: options.numInferenceSteps || 30
          }
        }
      );
      
      const imageUrl = Array.isArray(output) ? output[0] : output;
      
      return {
        url: imageUrl,
        quality: 95,
        model: 'flux-1.1-pro',
        generationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[Replicate] Flux Pro generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate image with Stable Diffusion XL (budget option)
   */
  async generateSDXL(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<ImageResult> {
    
    const startTime = Date.now();
    
    try {
      const output: any = await this.replicate.run(
        "stability-ai/sdxl:latest",
        {
          input: {
            prompt,
            width: options.width || 1024,
            height: options.height || 1024,
            negative_prompt: options.negativePrompt || 'blurry, low quality, watermark',
            num_outputs: 1,
            guidance_scale: options.guidanceScale || 7.5,
            num_inference_steps: options.numInferenceSteps || 30
          }
        }
      );
      
      const imageUrl = Array.isArray(output) ? output[0] : output;
      
      return {
        url: imageUrl,
        quality: 90,
        model: 'stable-diffusion-xl',
        generationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[Replicate] SDXL generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate 3D model with Meshy AI
   * Best for educational 3D content
   */
  async generateMeshy3D(
    prompt: string,
    options: Model3DOptions = {}
  ): Promise<Model3DResult> {
    
    const startTime = Date.now();
    
    try {
      // Note: Actual Meshy model ID may vary
      const output: any = await this.replicate.run(
        "meshy-ai/text-to-3d",
        {
          input: {
            prompt,
            art_style: options.artStyle || 'realistic',
            negative_prompt: options.negativePrompt || '',
            output_format: options.format || 'glb'
          }
        }
      );
      
      return {
        glbUrl: output.model_url || output,
        quality: 92,
        model: 'meshy-ai',
        generationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[Replicate] Meshy 3D generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate 3D model with Tripo AI (fastest)
   */
  async generateTripo3D(
    prompt: string,
    options: Model3DOptions = {}
  ): Promise<Model3DResult> {
    
    const startTime = Date.now();
    
    try {
      const output: any = await this.replicate.run(
        "tripo-ai/text-to-3d",
        {
          input: {
            prompt,
            output_format: options.format || 'glb'
          }
        }
      );
      
      return {
        glbUrl: output,
        quality: 88,
        model: 'tripo-ai',
        generationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[Replicate] Tripo 3D generation failed:', error);
      throw error;
    }
  }
  
  // NOTE: Deprecated methods removed - use Google Gemini client instead
}

/**
 * Create Replicate client
 */
export function createReplicateClient(apiKey?: string): ReplicateImageClient {
  return new ReplicateImageClient(apiKey);
}

/**
 * Singleton
 */
let globalReplicateClient: ReplicateImageClient | null = null;

export function getReplicateClient(): ReplicateImageClient {
  if (!globalReplicateClient) {
    globalReplicateClient = new ReplicateImageClient();
  }
  return globalReplicateClient;
}

export default {
  ReplicateImageClient,
  createReplicateClient,
  getReplicateClient
};

