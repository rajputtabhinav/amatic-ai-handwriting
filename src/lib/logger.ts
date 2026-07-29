/**
 * Centralized logging utility
 * Provides environment-aware logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction && level === 'debug') {
      return false;
    }
    return true;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }

  // API-specific logging
  apiRequest(method: string, path: string, userId?: string): void {
    this.debug(`API ${method} ${path}`, { userId });
  }

  logApiRequest(path: string, method: string, userId?: string): void {
    this.apiRequest(method, path, userId);
  }

  apiError(method: string, path: string, error: unknown): void {
    this.error(`API ${method} ${path} failed`, error);
  }

  // Database logging
  dbQuery(operation: string, table: string): void {
    this.debug(`DB ${operation} on ${table}`);
  }

  logDatabaseOperation(operation: string, table: string): void {
    this.dbQuery(operation, table);
  }

  dbError(operation: string, table: string, error: unknown): void {
    this.error(`DB ${operation} on ${table} failed`, error);
  }
}

export const logger = new Logger();

