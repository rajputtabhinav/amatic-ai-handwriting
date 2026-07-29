/**
 * Performance Metrics Tracking
 * Monitors and reports application performance metrics
 */

import { logger } from '../logger';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean;

  constructor() {
    this.enabled = typeof window !== 'undefined' && 'performance' in window;
  }

  // Core Web Vitals
  measureCLS() {
    if (!this.enabled) return;

    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      // Report after 5 seconds
      setTimeout(() => {
        this.reportMetric({
          name: 'CLS',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
        observer.disconnect();
      }, 5000);
    } catch (error) {
      logger.error('Error measuring CLS', error);
    }
  }

  measureLCP() {
    if (!this.enabled) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;

        this.reportMetric({
          name: 'LCP',
          value: lcp,
          rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      logger.error('Error measuring LCP', error);
    }
  }

  measureFID() {
    if (!this.enabled) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;

          this.reportMetric({
            name: 'FID',
            value: fid,
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
          });
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      logger.error('Error measuring FID', error);
    }
  }

  measureTTFB() {
    if (!this.enabled) return;

    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;

        this.reportMetric({
          name: 'TTFB',
          value: ttfb,
          rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error('Error measuring TTFB', error);
    }
  }

  // Custom metrics
  measureCustom(name: string, value: number) {
    this.reportMetric({
      name,
      value,
      rating: 'good', // Custom metrics don't have predefined thresholds
      timestamp: Date.now(),
    });
  }

  // Mark and measure
  mark(name: string) {
    if (!this.enabled) return;
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (!this.enabled) return;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.measureCustom(name, measure.duration);
      }
    } catch (error) {
      logger.error(`Error measuring ${name}`, error);
    }
  }

  private reportMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Performance: ${metric.name} = ${metric.value.toFixed(2)}ms (${metric.rating})`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to your analytics service (e.g., Google Analytics, Vercel Analytics)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_value: metric.value,
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize Core Web Vitals tracking
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    performanceMonitor.measureTTFB();
    performanceMonitor.measureLCP();
    performanceMonitor.measureFID();
    performanceMonitor.measureCLS();
  });
}

