/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides robust retry logic for API calls and async operations
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Execute an async function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    baseDelay = DEFAULT_OPTIONS.baseDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    retryableErrors,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (retryableErrors && retryableErrors.length > 0) {
        const isRetryable = retryableErrors.some(
          (msg) => lastError!.message.toLowerCase().includes(msg.toLowerCase())
        );
        if (!isRetryable) {
          throw lastError;
        }
      }

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      // Notify about retry
      onRetry?.(attempt + 1, lastError, delay);

      // Wait before next attempt
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry decorator for class methods
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFunction = (...args: unknown[]) => Promise<unknown>;

export function Retry(options: RetryOptions = {}) {
  return function <T extends AsyncFunction>(
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    } as T;

    return descriptor;
  };
}

/**
 * Create a retryable fetch wrapper
 */
export function createRetryableFetch(options: RetryOptions = {}) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    return withRetry(async () => {
      const response = await fetch(input, init);

      // Retry on specific status codes
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    }, {
      ...options,
      retryableErrors: [
        'HTTP 429',
        'HTTP 500',
        'HTTP 502',
        'HTTP 503',
        'HTTP 504',
        'network error',
        'fetch failed',
        ...(options.retryableErrors || []),
      ],
    });
  };
}

/**
 * Wrap API route handler with retry logic for upstream calls
 */
export function withUpstreamRetry<T>(
  handler: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(handler, {
    maxRetries: 2,
    baseDelay: 500,
    ...options,
    onRetry: (attempt, error, delay) => {
      console.warn(`Upstream retry ${attempt}: ${error.message}, waiting ${delay}ms`);
      options.onRetry?.(attempt, error, delay);
    },
  });
}

