import { sanitizeForLogging } from '../errors/sanitize';

/**
 * Log levels supported by the application
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Interface for structured metadata in log entries
 */
export interface LogMetadata {
  component?: string;
  operation?: string;
  requestId?: string;
  durationMs?: number;
  [key: string]: any;
}

/**
 * Determines the current log level from environment variables
 * Defaults to INFO if not specified
 */
function getLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();

  switch (envLogLevel) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    case 'fatal':
      return LogLevel.FATAL;
    default:
      return LogLevel.INFO;
  }
}

/**
 * Formats a log message with timestamp and level
 */
function formatLogMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Safely converts an object to JSON string, handling circular references
 */
function safeStringify(obj: unknown): string {
  const seen = new Set();
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Writes a log entry to the console
 */
function writeLog(level: LogLevel, levelName: string, message: string, meta?: LogMetadata): void {
  try {
    // Only log if the current level is appropriate
    const currentLevel = getLogLevel();
    const levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
      [LogLevel.FATAL]: 4,
    };

    if (levelPriority[level] < levelPriority[currentLevel]) {
      return;
    }

    // Format the message
    const formattedMessage = formatLogMessage(levelName, message);

    // Add metadata if present
    const metaString = meta ? ` ${safeStringify(sanitizeForLogging(meta))}` : '';

    // Use process.stdout/stderr instead of console methods
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      process.stderr.write(formattedMessage + metaString + '\n');
    } else {
      process.stdout.write(formattedMessage + metaString + '\n');
    }
  } catch (error) {
    process.stderr.write(`[${new Date().toISOString()}] [ERROR] Failed to log: ${error}\n`);
  }
}

/**
 * Logger object with enhanced capabilities
 */
export const logger = {
  /**
   * Log a debug message
   */
  debug(message: string, meta?: LogMetadata): void {
    writeLog(LogLevel.DEBUG, 'DEBUG', message, meta);
  },

  /**
   * Log an informational message
   */
  info(message: string, meta?: LogMetadata): void {
    writeLog(LogLevel.INFO, 'INFO', message, meta);
  },

  /**
   * Log a warning message
   */
  warn(message: string, meta?: LogMetadata): void {
    writeLog(LogLevel.WARN, 'WARN', message, meta);
  },

  /**
   * Log an error message
   * Can be called either as:
   * - error(message)
   * - error(message, error)
   * - error(message, meta)
   * - error(message, error, meta)
   */
  error(message: string, errorOrMeta?: Error | LogMetadata, meta?: LogMetadata): void {
    // Handle the different call patterns
    let errorMeta: LogMetadata = {};

    if (errorOrMeta instanceof Error) {
      // error(message, error, meta)
      errorMeta = {
        ...meta,
        error: {
          name: errorOrMeta.name,
          message: errorOrMeta.message,
          stack: errorOrMeta.stack,
        },
      };
    } else if (errorOrMeta && typeof errorOrMeta === 'object') {
      // error(message, meta)
      errorMeta = errorOrMeta;
    }

    writeLog(LogLevel.ERROR, 'ERROR', message, errorMeta);
  },

  /**
   * Log a fatal error message
   */
  fatal(message: string, errorOrMeta?: Error | LogMetadata, meta?: LogMetadata): void {
    let errorMeta: LogMetadata = {};

    if (errorOrMeta instanceof Error) {
      // fatal(message, error, meta)
      errorMeta = {
        ...meta,
        error: {
          name: errorOrMeta.name,
          message: errorOrMeta.message,
          stack: errorOrMeta.stack,
        },
      };
    } else if (errorOrMeta && typeof errorOrMeta === 'object') {
      // fatal(message, meta)
      errorMeta = errorOrMeta;
    }

    writeLog(LogLevel.FATAL, 'FATAL', message, errorMeta);
  },
};

// For convenience in importing
export default logger;
