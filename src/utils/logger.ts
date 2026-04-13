/**
 * logger.ts
 * Structured logger for core services.
 * Outputs JSON-formatted log entries for consistent observability.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('lot.created', { lot_id: 'MG-2026-001', producer_id: '...' });
 *   logger.error('lot.create_failed', { lot_id: 'MG-2026-001' }, error);
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_MIN_LEVEL: LogLevel =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_MIN_LEVEL];
}

function formatEntry(level: LogLevel, event: string, data?: Record<string, unknown>, err?: unknown): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
  };

  if (data && Object.keys(data).length > 0) {
    entry.data = data;
  }

  if (err) {
    if (err instanceof Error) {
      entry.error = {
        message: err.message,
        stack: err.stack,
        code: (err as any).code,
      };
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      entry.error = {
        message: (err as any).message,
        code: (err as any).code,
      };
    } else {
      entry.error = { message: String(err) };
    }
  }

  return entry;
}

function emit(level: LogLevel, entry: LogEntry): void {
  const json = JSON.stringify(entry);
  switch (level) {
    case 'debug':
      console.debug(json);
      break;
    case 'info':
      console.info(json);
      break;
    case 'warn':
      console.warn(json);
      break;
    case 'error':
      console.error(json);
      break;
  }
}

export const logger = {
  debug(event: string, data?: Record<string, unknown>) {
    if (!shouldLog('debug')) return;
    emit('debug', formatEntry('debug', event, data));
  },

  info(event: string, data?: Record<string, unknown>) {
    if (!shouldLog('info')) return;
    emit('info', formatEntry('info', event, data));
  },

  warn(event: string, data?: Record<string, unknown>, err?: unknown) {
    if (!shouldLog('warn')) return;
    emit('warn', formatEntry('warn', event, data, err));
  },

  error(event: string, data?: Record<string, unknown>, err?: unknown) {
    if (!shouldLog('error')) return;
    emit('error', formatEntry('error', event, data, err));
  },

  /**
   * Convenience: wrap a service call with structured logging.
   * Logs start + success/failure automatically.
   */
  async traced<T>(
    event: string,
    data: Record<string, unknown>,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    this.info(`${event}.start`, data);
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);
      this.info(`${event}.success`, { ...data, duration_ms: durationMs });
      return result;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      this.error(`${event}.failed`, { ...data, duration_ms: durationMs }, err);
      throw err;
    }
  },
};
