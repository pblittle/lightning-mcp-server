import pino from 'pino';
import { sanitizeErrorMessage, sanitizeConfig } from './sanitize';

// Determine the environment
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Logger configuration
 */
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Add serializers to consistently handle common object types
  serializers: {
    err: (err) => {
      if (!err) return err;

      // Handle Error objects
      return {
        type: err.constructor.name,
        message: sanitizeErrorMessage(err.message || String(err)),
        stack: isDevelopment ? err.stack : undefined,
      };
    },
    error: (err) => {
      if (!err) return err;

      // Handle general error objects that might not be instances of Error
      if (err instanceof Error) {
        return {
          type: err.constructor.name,
          message: sanitizeErrorMessage(err.message),
          stack: isDevelopment ? err.stack : undefined,
        };
      }

      return {
        message: sanitizeErrorMessage(String(err)),
      };
    },
    config: (config) => sanitizeConfig(config || {}),
  },

  // Automatically redact sensitive fields
  redact: {
    paths: [
      'password',
      'cert',
      'macaroon',
      'secret',
      'token',
      'key',
      'credential',
      'auth',
      '*.password',
      '*.cert',
      '*.macaroon',
      '*.secret',
      '*.token',
      '*.key',
      '*.credential',
      '*.auth',
      'headers.authorization',
      'headers.cookie',
    ],
    censor: '[REDACTED]',
  },
});

export default logger;
