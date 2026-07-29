import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiting configuration
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Fallback in-memory store for development
const memoryStore = new Map();

// Chat API rate limit: 30 requests per minute per user
export const chatRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
}) : {
  // Fallback rate limiter using in-memory storage
  limit: async (identifier: string) => {
    const key = `chat:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = 30;
    
    const requests = memoryStore.get(key) || [];
    const validRequests = requests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(Math.min(...validRequests) + windowMs),
      };
    }
    
    validRequests.push(now);
    memoryStore.set(key, validRequests);
    
    return {
      success: true,
      limit,
      remaining: limit - validRequests.length,
      reset: new Date(now + windowMs),
    };
  }
};

// Subscription API rate limit: 5 requests per minute per user
export const subscriptionRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
}) : {
  limit: async (identifier: string) => {
    const key = `subscription:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 5;
    
    const requests = memoryStore.get(key) || [];
    const validRequests = requests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(Math.min(...validRequests) + windowMs),
      };
    }
    
    validRequests.push(now);
    memoryStore.set(key, validRequests);
    
    return {
      success: true,
      limit,
      remaining: limit - validRequests.length,
      reset: new Date(now + windowMs),
    };
  }
};

// General API rate limit: 100 requests per minute per IP
export const apiRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
}) : {
  limit: async (identifier: string) => {
    const key = `api:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 100;
    
    const requests = memoryStore.get(key) || [];
    const validRequests = requests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(Math.min(...validRequests) + windowMs),
      };
    }
    
    validRequests.push(now);
    memoryStore.set(key, validRequests);
    
    return {
      success: true,
      limit,
      remaining: limit - validRequests.length,
      reset: new Date(now + windowMs),
    };
  }
};

// Visual AI rate limit: 20 requests per minute per user (heavier operations)
export const visualAIRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
}) : {
  limit: async (identifier: string) => {
    const key = `visual:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 20;
    
    const requests = memoryStore.get(key) || [];
    const validRequests = requests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(Math.min(...validRequests) + windowMs),
      };
    }
    
    validRequests.push(now);
    memoryStore.set(key, validRequests);
    
    return {
      success: true,
      limit,
      remaining: limit - validRequests.length,
      reset: new Date(now + windowMs),
    };
  }
};

// Reasoning stream rate limit: 15 requests per minute per user (expensive R1 calls)
export const reasoningRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 m'),
  analytics: true,
}) : {
  limit: async (identifier: string) => {
    const key = `reasoning:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 15;
    
    const requests = memoryStore.get(key) || [];
    const validRequests = requests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: new Date(Math.min(...validRequests) + windowMs),
      };
    }
    
    validRequests.push(now);
    memoryStore.set(key, validRequests);
    
    return {
      success: true,
      limit,
      remaining: limit - validRequests.length,
      reset: new Date(now + windowMs),
    };
  }
};

// Helper to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}
