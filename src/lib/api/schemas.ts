import { z } from 'zod';

/**
 * API Request Validation Schemas using Zod
 * Provides runtime type checking and validation for all API endpoints
 */

// Chat API Schemas
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).optional().default([]),
  provider: z.enum(['openai']).optional().default('openai'),
  modelKey: z.string().optional(),
  subject: z.string().optional()
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// Canvas Answer Question Schema
export const canvasAnswerSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000, 'Question too long'),
  modelKey: z.string().optional()
});

export type CanvasAnswerInput = z.infer<typeof canvasAnswerSchema>;

// Subscription Creation Schema
export const subscriptionCreateSchema = z.object({
  planType: z.enum(['starter', 'basic', 'standard', 'professional', 'business', 'premium', 'enterprise'])
});

export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>;

// Voice Synthesis Schema
export const voiceSynthesisSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
  settings: z.object({
    stability: z.number().min(0).max(1).optional(),
    similarity_boost: z.number().min(0).max(1).optional(),
    speed: z.number().min(0.25).max(4).optional()
  }).optional()
});

export type VoiceSynthesisInput = z.infer<typeof voiceSynthesisSchema>;

// User Query Schema (for user operations)
export const userQuerySchema = z.object({
  clerkUserId: z.string().min(1),
  email: z.string().email().optional(),
  fullName: z.string().optional()
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;

// Webhook Payload Schema
export const razorpayWebhookSchema = z.object({
  entity: z.string(),
  account_id: z.string(),
  event: z.string(),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({
      entity: z.record(z.unknown())
    }).optional(),
    subscription: z.object({
      entity: z.record(z.unknown())
    }).optional()
  }),
  created_at: z.number()
});

export type RazorpayWebhookPayload = z.infer<typeof razorpayWebhookSchema>;

/**
 * Validation helper function
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws ZodError
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation helper (returns error instead of throwing)
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns { success: true, data } or { success: false, error }
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

