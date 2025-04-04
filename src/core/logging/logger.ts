/**
 * @fileoverview Logger implementation with built-in sanitization
 *
 * This module provides a structured logging solution using Pino,
 * with built-in redaction of sensitive information and proper error object handling.
 */

import pino from 'pino';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeError, sanitizeForLogging } from '../errors/sanitize';

/**
 * Interface for structured metadata in log entries (internal use only)
 */
interface LogMetadata {
  component?: string;
  operation?: string;
  requestId?: string;
  durationMs?: number;
  [key: string]: any;
}

// Get log level from environment
const LOG_LEVEL = process.env.LOG_LEVEL?.toLowerCase() || 'info';

// Ensure logs directory exists in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

import { REDACT_PATHS } from './redaction-config';

// Check environment
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Get the appropriate transport configuration based on environment
 */
function getTransportConfig() {
  if (isTest) {
    return undefined; // No transport needed in test mode
  }

  if (isProduction) {
    return {
      target: 'pino/file',
      options: {
        destination: './logs/app.log',
        mkdir: true,
        // Basic rotation config
        rotate: {
          size: '10M',
          maxFiles: 5,
        },
      },
    };
  }

  // Development mode
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

// Create the Pino logger instance
const pinoLogger = pino({
  name: 'lightning-mcp-server',
  // If in test environment, don't output any logs by setting the level to silent
  level: isTest ? 'silent' : LOG_LEVEL,
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
  serializers: {
    // Use the standard error serializer but extend it for domain-specific errors
    err: (err) => {
      if (!err) {
        return err;
      }

      // Ensure error is sanitized before serialization
      const sanitizedError = (err as any).isSanitized ? err : sanitizeError(err);

      // Basic serialization
      const serialized: Record<string, any> = {
        type: sanitizedError.constructor.name,
        message: sanitizedError.message,
        stack: sanitizedError.stack,
      };

      // Add domain-specific properties if they exist
      if (typeof sanitizedError === 'object') {
        if ('code' in sanitizedError) {
          serialized.code = sanitizedError.code;
        }

        if ('metadata' in sanitizedError) {
          // Ensure metadata is sanitized
          serialized.metadata = sanitizeForLogging(sanitizedError.metadata);
        }

        if ('cause' in sanitizedError && sanitizedError.cause) {
          // Handle cause if present (but avoid infinite recursion)
          const cause = sanitizedError.cause as any;
          serialized.cause = {
            type: cause.constructor?.name,
            message: sanitizeError(cause).message, // Ensure cause message is sanitized
            stack: cause.stack,
          };
        }
      }

      return serialized;
    },
    // Add a serializer for HTTP req/res objects
    req: (req) => {
      if (!req) return req;

      return {
        id: req.id,
        method: req.method,
        url: req.url,
        // Sanitize headers which might contain sensitive info
        headers: sanitizeHeaders(req.headers || {}),
      };
    },
    // Add a serializer for metadata to ensure all objects are sanitized
    // even when not explicitly tagged as sensitive
    metadata: (data) => {
      if (!data) return data;
      return sanitizeForLogging(data);
    },
  },
  // Format timestamp as ISO string for better readability and parsing
  timestamp: pino.stdTimeFunctions.isoTime,
  // Add a unique ID to every log entry for correlation
  mixin: () => {
    return {
      requestId: crypto.randomUUID(),
      environment: process.env.NODE_ENV || 'development',
    };
  },
  // Get transport configuration based on environment
  transport: getTransportConfig(),
});

/**
 * Sanitizes HTTP headers to protect sensitive information
 * @param headers HTTP headers object
 * @returns Sanitized headers object
 */
// Export for testing purposes
export function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-lnd-macaroon',
    'macaroon',
    'api-key',
    'token',
    'credential',
    'cert',
    'secret',
  ];

  const sanitized = { ...headers };

  for (const header of sensitiveHeaders) {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitizes log metadata to protect sensitive information
 * @param meta Log metadata object
 * @returns Sanitized metadata
 */
function sanitizeMetadata(meta?: LogMetadata): Record<string, any> {
  if (!meta) return {};

  // Process with sanitizeForLogging when not in test mode
  return process.env.NODE_ENV !== 'test' ? sanitizeForLogging(meta) : meta;
}

/**
 * Wraps an error to ensure it's properly sanitized for logging
 * @param error The error to sanitize
 * @returns A sanitized error object
 */
function prepareSafeError(error: Error | unknown): Error {
  if (!error) return new Error('Unknown error');

  // Mark the error as sanitized to avoid double-sanitization
  const sanitizedError = sanitizeError(error);
  (sanitizedError as any).isSanitized = true;
  return sanitizedError;
}

/**
 * Logger object with enhanced capabilities
 */
export const logger = {
  /**
   * Log a debug message
   * @param message Message to log
   * @param meta Optional metadata to include
   */
  debug(message: string, meta?: LogMetadata): void {
    pinoLogger.debug(sanitizeMetadata(meta), message);
  },

  /**
   * Log an informational message
   * @param message Message to log
   * @param meta Optional metadata to include
   */
  info(message: string, meta?: LogMetadata): void {
    pinoLogger.info(sanitizeMetadata(meta), message);
  },

  /**
   * Log a warning message
   * @param message Message to log
   * @param meta Optional metadata to include
   */
  warn(message: string, meta?: LogMetadata): void {
    pinoLogger.warn(sanitizeMetadata(meta), message);
  },

  /**
   * Log an error message
   * Can be called either as:
   * - error(message)
   * - error(message, error)
   * - error(message, meta)
   * - error(message, error, meta)
   * @param message Error message
   * @param errorOrMeta Error object or metadata
   * @param meta Additional metadata
   */
  error(message: string, errorOrMeta?: Error | LogMetadata, meta?: LogMetadata): void {
    if (errorOrMeta instanceof Error) {
      // error(message, error, meta)
      const sanitizedMeta = sanitizeMetadata(meta);
      pinoLogger.error(
        {
          err: prepareSafeError(errorOrMeta),
          ...sanitizedMeta,
        },
        message
      );
    } else {
      // error(message) or error(message, meta)
      pinoLogger.error(sanitizeMetadata(errorOrMeta), message);
    }
  },

  /**
   * Log a fatal error message
   * @param message Error message
   * @param errorOrMeta Error object or metadata
   * @param meta Additional metadata
   */
  fatal(message: string, errorOrMeta?: Error | LogMetadata, meta?: LogMetadata): void {
    if (errorOrMeta instanceof Error) {
      // fatal(message, error, meta)
      const sanitizedMeta = sanitizeMetadata(meta);
      pinoLogger.fatal(
        {
          err: prepareSafeError(errorOrMeta),
          ...sanitizedMeta,
        },
        message
      );
    } else {
      // fatal(message) or fatal(message, meta)
      pinoLogger.fatal(sanitizeMetadata(errorOrMeta), message);
    }
  },

  /**
   * Create a child logger with additional context
   * @param bindings Context to bind to all log messages
   * @returns Child logger instance
   */
  child(bindings: Record<string, any>) {
    // Sanitize the bindings before creating child logger
    const sanitizedBindings = sanitizeMetadata(bindings);
    const childPino = pinoLogger.child(sanitizedBindings);

    return {
      debug: (message: string, meta?: LogMetadata) => {
        childPino.debug(sanitizeMetadata(meta), message);
      },
      info: (message: string, meta?: LogMetadata) => {
        childPino.info(sanitizeMetadata(meta), message);
      },
      warn: (message: string, meta?: LogMetadata) => {
        childPino.warn(sanitizeMetadata(meta), message);
      },
      error: (message: string, errorOrMeta?: Error | LogMetadata, meta?: LogMetadata) => {
        if (errorOrMeta instanceof Error) {
          const sanitizedMeta = sanitizeMetadata(meta);
          childPino.error(
            {
              err: prepareSafeError(errorOrMeta),
              ...sanitizedMeta,
            },
            message
          );
        } else {
          childPino.error(sanitizeMetadata(errorOrMeta), message);
        }
      },
      fatal: (message: string, errorOrMeta?: Error | LogMetadata, meta?: LogMetadata) => {
        if (errorOrMeta instanceof Error) {
          const sanitizedMeta = sanitizeMetadata(meta);
          childPino.fatal(
            {
              err: prepareSafeError(errorOrMeta),
              ...sanitizedMeta,
            },
            message
          );
        } else {
          childPino.fatal(sanitizeMetadata(errorOrMeta), message);
        }
      },
    };
  },
};

// For convenience in importing
export default logger;
