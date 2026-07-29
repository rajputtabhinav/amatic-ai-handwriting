import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '../logger';

/**
 * API Middleware utilities for Next.js 15 App Router
 * Provides composable middleware for authentication, rate limiting, and error handling
 */

export type APIHandler<T = unknown> = (
  request: NextRequest,
  context: { userId: string; params?: Record<string, string> }
) => Promise<NextResponse<T>>;

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  const response = {
    error: message,
    status,
    ...(process.env.NODE_ENV === 'development' && details ? { details } : {})
  };
  
  logger.error('API Error', { message, status, details });
  
  return NextResponse.json(response, { status });
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<{ success: true; data: T }> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Authentication middleware
 * Ensures user is authenticated via Clerk
 */
export function withAuth(handler: APIHandler) {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        return errorResponse('Unauthorized - Authentication required', 401);
      }
      
      return await handler(request, { userId, params: context?.params });
    } catch (error) {
      logger.error('Authentication error', error);
      return errorResponse('Authentication failed', 401, error);
    }
  };
}

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(
  limiter: { limit: (identifier: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date | number;
  }> },
  getIdentifier: (request: NextRequest, userId?: string) => string = (_, userId) => userId || 'anonymous'
) {
  return (handler: APIHandler) => {
    return async (request: NextRequest, context: { userId: string; params?: Record<string, string> }) => {
      const identifier = getIdentifier(request, context.userId);
      const { success, limit, remaining, reset } = await limiter.limit(identifier);
      
      if (!success) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            limit,
            remaining,
            reset: reset instanceof Date ? reset.getTime() : reset,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': (reset instanceof Date ? reset.getTime() : reset).toString(),
            },
          }
        );
      }
      
      const response = await handler(request, context);
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', (reset instanceof Date ? reset.getTime() : reset).toString());
      
      return response;
    };
  };
}

/**
 * Error handling middleware
 * Catches and formats errors consistently
 */
export function withErrorHandling(handler: APIHandler) {
  return async (request: NextRequest, context: { userId: string; params?: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      
      // Handle known error types
      if (error instanceof Error) {
        logger.error('API Handler Error', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production') {
          return errorResponse('Internal server error', 500);
        }
        
        return errorResponse(error.message, 500, {
          name: error.name,
          stack: error.stack
        });
      }
      
      // Unknown error type
      logger.error('Unknown API Error', error);
      return errorResponse('An unexpected error occurred', 500, error);
    }
  };
}

/**
 * Request logging middleware
 * Logs all API requests for debugging and monitoring
 */
export function withLogging(handler: APIHandler) {
  return async (request: NextRequest, context: { userId: string; params?: Record<string, string> }) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    logger.info('API Request', {
      requestId,
      method: request.method,
      url: request.url,
      userId: context.userId,
      userAgent: request.headers.get('user-agent')
    });
    
    try {
      const response = await handler(request, context);
      
      const duration = Date.now() - startTime;
      logger.info('API Response', {
        requestId,
        status: response.status,
        duration: `${duration}ms`
      });
      
      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Request Failed', {
        requestId,
        duration: `${duration}ms`,
        error
      });
      throw error;
    }
  };
}

/**
 * Compose multiple middleware functions
 * Usage: compose(withAuth, withRateLimit(limiter), withErrorHandling, withLogging)(handler)
 */
export function compose(...middlewares: Array<(handler: APIHandler) => APIHandler>) {
  return (handler: APIHandler): APIHandler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * Standard API route wrapper with common middleware
 * Includes: auth, error handling, and logging
 */
export function createProtectedRoute(handler: APIHandler) {
  return compose(
    withAuth,
    withErrorHandling,
    withLogging
  )(handler);
}

/**
 * Standard API route wrapper with rate limiting
 */
export function createRateLimitedRoute(
  limiter: Parameters<typeof withRateLimit>[0],
  handler: APIHandler
) {
  return compose(
    withAuth,
    withRateLimit(limiter),
    withErrorHandling,
    withLogging
  )(handler);
}

