/**
 * Sentry Error Tracking Configuration
 * Provides centralized error tracking and monitoring
 */

import { logger } from './logger';

interface SentryConfig {
  dsn?: string;
  environment: string;
  enabled: boolean;
  sampleRate: number;
  tracesSampleRate: number;
}

class ErrorTracker {
  private config: SentryConfig;
  private initialized = false;

  constructor() {
    this.config = {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      sampleRate: 1.0,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    };
  }

  async init() {
    if (this.initialized || !this.config.enabled) {
      return;
    }

    try {
      // Check if @sentry/nextjs is installed
      const Sentry = await import('@sentry/nextjs').catch(() => {
        logger.warn('Sentry package not installed. Install with: npm install @sentry/nextjs');
        throw new Error('Sentry not installed');
      });

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Performance Monitoring
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        
        // Error filtering
        beforeSend(event, hint) {
          // Filter out known non-critical errors
          const error = hint.originalException;
          
          if (error && typeof error === 'object' && 'message' in error) {
            const message = String(error.message);
            
            // Ignore browser extension errors
            if (message.includes('chrome-extension://') || message.includes('moz-extension://')) {
              return null;
            }
            
            // Ignore network errors that are expected
            if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
              return null;
            }
          }
          
          return event;
        },
        
        // Ignore specific errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'AbortError',
          'NotAllowedError',
        ],
      });

      this.initialized = true;
      logger.info('Sentry error tracking initialized');
    } catch (error) {
      logger.error('Failed to initialize Sentry', error);
    }
  }

  captureException(error: Error, context?: Record<string, unknown>) {
    if (!this.config.enabled) {
      logger.error('Error (Sentry disabled):', error, context);
      return;
    }

    import('@sentry/nextjs').then((Sentry) => {
      if (context) {
        Sentry.setContext('additional', context);
      }
      Sentry.captureException(error);
    }).catch(() => {
      logger.error('Error (Sentry not available):', error, context);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.config.enabled) {
      logger.info(`Message (Sentry disabled): ${message}`);
      return;
    }

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage(message, level);
    }).catch(() => {
      logger.info(`Message (Sentry not available): ${message}`);
    });
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser(user);
    }).catch(() => {
      // Sentry not available
    });
  }

  clearUser() {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser(null);
    }).catch(() => {
      // Sentry not available
    });
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, unknown>;
  }) {
    if (!this.config.enabled) return;

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.addBreadcrumb(breadcrumb);
    }).catch(() => {
      // Sentry not available
    });
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Initialize on import (only in browser)
if (typeof window !== 'undefined') {
  errorTracker.init();
}

