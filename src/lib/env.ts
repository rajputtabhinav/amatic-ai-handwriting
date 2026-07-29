/**
 * Environment variable validation and type-safe access
 * Validates required environment variables at startup
 */

import { logger } from './logger';

interface EnvConfig {
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;

  // Supabase Database
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Razorpay Payments
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_RAZORPAY_KEY_ID: string;

  // AI APIs (optional - app works without them)
  ANTHROPIC_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  GOOGLE_GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;

  // Rate Limiting (optional)
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;

  // Application URLs
  NEXT_PUBLIC_APP_URL: string;
}

const PLACEHOLDER_VALUES = [
  'your_',
  'placeholder',
  'example',
  'test_placeholder',
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return PLACEHOLDER_VALUES.some(placeholder => value.includes(placeholder));
}

function validateEnvVar(
  name: keyof EnvConfig,
  value: string | undefined,
  required: boolean = true
): string | undefined {
  // Check if variable exists
  if (!value || value.trim() === '') {
    if (required) {
      logger.error(`Missing required environment variable: ${name}`);
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return undefined;
  }

  // Check if it's a placeholder value
  if (required && isPlaceholder(value)) {
    logger.error(`Environment variable ${name} is not configured (still has placeholder value)`);
    throw new Error(`Environment variable ${name} is not configured properly`);
  }

  return value;
}

/**
 * Validates and returns type-safe environment variables
 * Throws error if required variables are missing or invalid
 */
export function validateEnv(): EnvConfig {
  const env = process.env;
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    const config: EnvConfig = {
      // Required Clerk variables
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: validateEnvVar(
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        true
      )!,
      CLERK_SECRET_KEY: validateEnvVar('CLERK_SECRET_KEY', env.CLERK_SECRET_KEY, true)!,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: validateEnvVar(
        'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
        env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
        false
      ) || '/sign-in',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: validateEnvVar(
        'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
        env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
        false
      ) || '/sign-up',

      // Supabase variables (REQUIRED in production)
      NEXT_PUBLIC_SUPABASE_URL: validateEnvVar(
        'NEXT_PUBLIC_SUPABASE_URL',
        env.NEXT_PUBLIC_SUPABASE_URL,
        isProduction
      ) || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: validateEnvVar(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        isProduction
      ) || 'placeholder',
      SUPABASE_SERVICE_ROLE_KEY: validateEnvVar(
        'SUPABASE_SERVICE_ROLE_KEY',
        env.SUPABASE_SERVICE_ROLE_KEY,
        isProduction
      ) || 'placeholder',

      // Razorpay variables (REQUIRED in production)
      RAZORPAY_KEY_ID: validateEnvVar('RAZORPAY_KEY_ID', env.RAZORPAY_KEY_ID, isProduction) || 'placeholder',
      RAZORPAY_KEY_SECRET: validateEnvVar('RAZORPAY_KEY_SECRET', env.RAZORPAY_KEY_SECRET, isProduction) || 'placeholder',
      RAZORPAY_WEBHOOK_SECRET: validateEnvVar(
        'RAZORPAY_WEBHOOK_SECRET',
        env.RAZORPAY_WEBHOOK_SECRET,
        isProduction
      ) || 'placeholder',
      NEXT_PUBLIC_RAZORPAY_KEY_ID: validateEnvVar(
        'NEXT_PUBLIC_RAZORPAY_KEY_ID',
        env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        isProduction
      ) || 'placeholder',

      // Optional AI API keys
      ANTHROPIC_API_KEY: validateEnvVar('ANTHROPIC_API_KEY', env.ANTHROPIC_API_KEY, false),
      GOOGLE_AI_API_KEY: validateEnvVar('GOOGLE_AI_API_KEY', env.GOOGLE_AI_API_KEY, false),
      GOOGLE_GEMINI_API_KEY: validateEnvVar('GOOGLE_GEMINI_API_KEY', env.GOOGLE_GEMINI_API_KEY, false),
      ELEVENLABS_API_KEY: validateEnvVar('ELEVENLABS_API_KEY', env.ELEVENLABS_API_KEY, false),
      OPENAI_API_KEY: validateEnvVar('OPENAI_API_KEY', env.OPENAI_API_KEY, false),
      OPENROUTER_API_KEY: validateEnvVar('OPENROUTER_API_KEY', env.OPENROUTER_API_KEY, false),

      // Optional Upstash Redis
      UPSTASH_REDIS_REST_URL: validateEnvVar(
        'UPSTASH_REDIS_REST_URL',
        env.UPSTASH_REDIS_REST_URL,
        false
      ),
      UPSTASH_REDIS_REST_TOKEN: validateEnvVar(
        'UPSTASH_REDIS_REST_TOKEN',
        env.UPSTASH_REDIS_REST_TOKEN,
        false
      ),

      // Application URL
      NEXT_PUBLIC_APP_URL: validateEnvVar(
        'NEXT_PUBLIC_APP_URL',
        env.NEXT_PUBLIC_APP_URL,
        false
      ) || 'http://localhost:3000',
    };

    // Warn about missing AI API keys
    if (!config.ANTHROPIC_API_KEY) {
      logger.warn('Anthropic API key not configured - Text/SVG generation will be limited');
    } else {
      logger.info('Anthropic API configured - Claude Sonnet 4 enabled');
    }
    
    if (!config.GOOGLE_AI_API_KEY && !config.GOOGLE_GEMINI_API_KEY) {
      logger.warn('Google Gemini API key not configured - Image generation will be limited');
    } else {
      logger.info('Google Gemini API configured - Image generation enabled');
    }
    
    if (!config.ELEVENLABS_API_KEY) {
      logger.warn('ElevenLabs API key not configured - Premium voice synthesis disabled');
    } else {
      logger.info('ElevenLabs API configured - Premium voice synthesis enabled');
    }

    if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) {
      if (isProduction) {
        logger.error('CRITICAL: Redis not configured in production - rate limiting will NOT work properly');
      } else {
        logger.warn('Upstash Redis not configured - rate limiting will use in-memory storage');
      }
    }

    // Production readiness check
    if (isProduction) {
      const missingCritical = [];
      if (config.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
        missingCritical.push('NEXT_PUBLIC_SUPABASE_URL');
      }
      if (config.RAZORPAY_KEY_ID === 'placeholder') {
        missingCritical.push('RAZORPAY_KEY_ID');
      }
      if (missingCritical.length > 0) {
        logger.error(`CRITICAL: Production deployment with placeholder values: ${missingCritical.join(', ')}`);
      }
    }

    logger.info('Environment variables validated successfully');
    return config;

  } catch (error) {
    logger.error('Environment validation failed', error);
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Call this in server-side code to ensure environment is properly configured
 */
export function getEnv(): EnvConfig {
  return validateEnv();
}

/**
 * Check if a specific feature is enabled based on environment variables
 */
export function isFeatureEnabled(feature: 'ai' | 'visual-ai' | 'voice' | 'redis' | 'images'): boolean {
  const env = process.env;
  
  switch (feature) {
    case 'ai':
      return Boolean(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY);
    case 'visual-ai':
      return Boolean(env.OPENROUTER_API_KEY || env.ANTHROPIC_API_KEY || env.GOOGLE_AI_API_KEY || env.GOOGLE_GEMINI_API_KEY);
    case 'images':
      return Boolean(env.GOOGLE_AI_API_KEY || env.GOOGLE_GEMINI_API_KEY);
    case 'voice':
      return Boolean(env.ELEVENLABS_API_KEY || env.OPENAI_API_KEY);
    case 'redis':
      return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
    default:
      return false;
  }
}

