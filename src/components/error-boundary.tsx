'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error Boundary caught an error:', error, errorInfo);
    
    // Send error to Sentry (if configured)
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Lazy load Sentry only if configured
      import('@/lib/sentry').then(({ errorTracker }) => {
        errorTracker.captureException(error, {
          componentStack: errorInfo.componentStack,
        });
      }).catch(() => {
        // Sentry not available, error already logged
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md rounded-lg border border-destructive/50 bg-card p-6 text-center shadow-lg">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="mb-4 text-muted-foreground">
              We&apos;re sorry, but something unexpected happened. The error has been logged and we&apos;ll look into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
