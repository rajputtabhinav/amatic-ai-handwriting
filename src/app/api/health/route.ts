import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/env';

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check critical services
  const checks = {
    database: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'),
    payments: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'placeholder'),
    auth: Boolean(process.env.CLERK_SECRET_KEY),
    ai: isFeatureEnabled('ai'),
    voice: isFeatureEnabled('voice'),
    redis: isFeatureEnabled('redis'),
  };

  // Determine overall health
  const criticalServices = ['database', 'payments', 'auth'];
  const criticalHealthy = criticalServices.every(service => checks[service as keyof typeof checks]);
  
  const status = criticalHealthy ? 'healthy' : 'degraded';
  const httpStatus = criticalHealthy ? 200 : 503;

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: isProduction ? 'production' : 'development',
    services: {
      database: checks.database ? 'connected' : 'unavailable',
      payments: checks.payments ? 'configured' : 'not configured',
      auth: checks.auth ? 'active' : 'inactive',
      ai: checks.ai ? 'available' : 'limited',
      voice: checks.voice ? 'available' : 'unavailable',
      redis: checks.redis ? 'connected' : 'in-memory fallback',
    },
    warnings: [
      ...(!checks.redis && isProduction ? ['Redis not configured - rate limiting degraded'] : []),
      ...(!checks.ai ? ['No AI API keys configured - using fallback responses'] : []),
      ...(!checks.voice ? ['Voice features unavailable - OpenAI API key missing'] : []),
    ]
  }, { status: httpStatus });
}