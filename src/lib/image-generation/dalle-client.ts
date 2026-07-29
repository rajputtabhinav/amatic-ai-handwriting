/**
 * DALL-E 3 Client
 * 
 * ⚠️ DEPRECATED - NO LONGER USED
 * All image generation now uses Google Gemini only.
 * This file can be deleted.
 * Highest quality photorealistic educational content.
 */

import OpenAI from 'openai';

export interface DALLEImageOptions {
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface DALLEResult {
  url: string;
  revisedPrompt?: string;
  quality: number;
  model: string;
  generationTime: number;
}

/**
 * DALL-E 3 Image Generation Client
 */
export class DALLEClient {
  private openai: OpenAI;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY || '';
    
    if (!key) {
      console.warn('[DALL-E] No API key provided');
    }
    
    this.openai = new OpenAI({ apiKey: key });
  }
  
  /**
   * Generate hero image with DALL-E 3
   */
  async generateHeroImage(
    prompt: string,
    options: DALLEImageOptions = {}
  ): Promise<DALLEResult> {
    
    const startTime = Date.now();
    
    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'hd',
        style: options.style || 'natural'
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from DALL-E');
      }
      
      const image = response.data[0];
      
      return {
        url: image.url!,
        revisedPrompt: image.revised_prompt,
        quality: 98,
        model: 'dall-e-3',
        generationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('[DALL-E] Generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if service is available
   */
  get isAvailable(): boolean {
    return !!this.openai.apiKey;
  }
}

/**
 * Create DALL-E client
 */
export function createDALLEClient(apiKey?: string): DALLEClient {
  return new DALLEClient(apiKey);
}

export default {
  DALLEClient,
  createDALLEClient
};

