/**
 * Google Gemini Image Generation Client
 * 
 * SIMPLIFIED: Single model for ALL 2D image generation using Gemini 2.5 Flash
 * - Text-to-image generation via Gemini API
 * - Educational diagrams and illustrations only
 * - Simple, fast, reliable
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: 'standard' | 'hd';
}

export interface ImageGenerationResult {
  url: string;
  base64?: string;
  quality: number;
  model: string;
  generationTime: number;
}

/**
 * Google AI Image Generation Client
 * Uses Gemini 2.5 Flash with Nano Banana capabilities
 */
export class GoogleAIImageClient {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || 
                  process.env.GOOGLE_AI_API_KEY || 
                  process.env.GOOGLE_GEMINI_API_KEY || 
                  process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || 
                  '';
    
    if (!this.apiKey) {
      console.warn('[GoogleAI] No API key provided. Image generation will fail.');
      console.warn('[GoogleAI] Please set GOOGLE_AI_API_KEY or GOOGLE_GEMINI_API_KEY in .env.local');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }
  
  /**
   * Check if service is available
   */
  get isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * Generate 2D image using Gemini 2.5 Flash
   * ONLY method for ALL image generation
   */
  async generateImage(
    prompt: string,
    options: ImageOptions = {}
  ): Promise<ImageGenerationResult> {
    
    const startTime = Date.now();
    
    try {
      // Use Gemini 2.5 Flash with image generation capabilities
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
      });
      
      // Build enhanced prompt for image generation
      const enhancedPrompt = this.buildPrompt(prompt, options);
      
      // Generate image with proper config
      const result = await model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ text: enhancedPrompt }] 
        }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4096,
          // Request image output
          responseMimeType: 'image/png',
        }
      });
      
      // Extract image from response
      const response = result.response;
      const { imageUrl, base64 } = await this.extractImageUrl(response);
      
      const generationTime = Date.now() - startTime;
      
      console.log(`[GoogleAI] ✅ Image generated in ${generationTime}ms`);
      
      return {
        url: imageUrl,
        base64,
        quality: 95,
        model: 'gemini-2.5-flash-image',
        generationTime
      };
      
    } catch (error) {
      console.error('[GoogleAI] Image generation failed:', error);
      throw new Error(`Gemini image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Alias for backward compatibility
   */
  async generateStandard2D(
    prompt: string,
    options: ImageOptions = {}
  ): Promise<ImageGenerationResult> {
    return this.generateImage(prompt, options);
  }
  
  /**
   * Alias for backward compatibility
   */
  async generate3DStyle(
    prompt: string,
    options: ImageOptions = {}
  ): Promise<ImageGenerationResult> {
    return this.generateImage(prompt, options);
  }
  
  /**
   * Alias for 3D figurine generation
   */
  async generate3DFigurine(
    prompt: string,
    options: ImageOptions = {}
  ): Promise<ImageGenerationResult> {
    return this.generateImage(prompt, options);
  }
  
  /**
   * Build prompt for image generation
   */
  private buildPrompt(
    basePrompt: string,
    options: ImageOptions
  ): string {
    
    return `Generate a high-quality educational image.

${basePrompt}

Requirements:
- Clear, professional visualization
- Educational context
- High resolution (${options.width || 1024}x${options.height || 1024})
- No watermarks or text overlays
- Suitable for learning materials`;
  }
  
  /**
   * Extract image URL and base64 from Gemini response
   */
  private async extractImageUrl(response: any): Promise<{ imageUrl: string; base64?: string }> {
    try {
      // Check if response contains image data
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        
        // Extract image from response parts
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Check for inline image data
            if (part.inlineData && part.inlineData.mimeType?.includes('image')) {
              const base64 = part.inlineData.data;
              const mimeType = part.inlineData.mimeType;
              
              // Create data URL for immediate use
              const dataUrl = `data:${mimeType};base64,${base64}`;
              
              return {
                imageUrl: dataUrl,
                base64: base64
              };
            }
            
            // Check for text response (might contain image URL)
            if (part.text) {
              const urlMatch = part.text.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|webp|gif)/i);
              if (urlMatch) {
                return {
                  imageUrl: urlMatch[0]
                };
              }
            }
          }
        }
      }
      
      // If no image found, throw error
      throw new Error('No image data found in Gemini response');
      
    } catch (error) {
      console.error('[GoogleAI] Failed to extract image:', error);
      console.error('[GoogleAI] Response structure:', JSON.stringify(response, null, 2));
      throw new Error(`Failed to extract image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
}

/**
 * Create Google AI client instance
 */
export function createGoogleAIClient(apiKey?: string): GoogleAIImageClient {
  return new GoogleAIImageClient(apiKey);
}

/**
 * Singleton instance
 */
let globalClient: GoogleAIImageClient | null = null;

export function getGoogleAIClient(): GoogleAIImageClient {
  if (!globalClient) {
    globalClient = new GoogleAIImageClient();
  }
  return globalClient;
}

export default {
  GoogleAIImageClient,
  createGoogleAIClient,
  getGoogleAIClient
};

