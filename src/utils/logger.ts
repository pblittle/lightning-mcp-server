/**
 * Simple logger utility without external dependencies
 * Falls back to console for logging if winston is not available
 */
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Ensure logs directory exists
try {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Could not create logs directory:', error);
}

// Log levels and their numeric values
export enum LogLevel {
  FATAL = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  HTTP = 4,
  DEBUG = 5,
}

// Convert level name to numeric value
function getLevelValue(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'fatal':
      return LogLevel.FATAL;
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'http':
      return LogLevel.HTTP;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      return LogLevel.INFO;
  }
}

// Determine appropriate log level based on environment
function getLogLevel(): LogLevel {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL || (env === 'development' ? 'debug' : 'warn');
  return getLevelValue(configuredLevel);
}

// Current configured log level
const currentLevel = getLogLevel();

/**
 * Formats a log message with timestamp and level
 */
function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${level.toUpperCase()}] ${message}`;
}

/**
 * Safely converts any value to a string, handling circular references
 */
export function safeStringify(obj: unknown): string {
  if (typeof obj === 'string') return obj;
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  try {
    // Use Node's util.inspect to handle circular references
    if (typeof obj === 'object') {
      return util.inspect(obj, {
        depth: 5,
        colors: false,
        maxArrayLength: 100,
        breakLength: Infinity,
      });
    }
    return String(obj);
  } catch (error) {
    return `[Unstringifiable Object: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

/**
 * Writes a log message to the console and file
 */
function writeLog(levelValue: LogLevel, levelName: string, message: string, meta?: unknown): void {
  // Only log if the level is at or below the current level
  if (levelValue > currentLevel) return;

  // Format message with metadata if provided
  let fullMessage = message;
  if (meta !== undefined) {
    fullMessage += ' ' + safeStringify(meta);
  }

  // Format with timestamp
  const formattedMessage = formatMessage(levelName, fullMessage);

  // Log to console with color
  switch (levelValue) {
    case LogLevel.FATAL:
      console.error('\x1b[41m\x1b[37m%s\x1b[0m', formattedMessage); // White on Red BG
      break;
    case LogLevel.ERROR:
      console.error('\x1b[31m%s\x1b[0m', formattedMessage); // Red
      break;
    case LogLevel.WARN:
      console.warn('\x1b[33m%s\x1b[0m', formattedMessage); // Yellow
      break;
    case LogLevel.INFO:
      console.info('\x1b[32m%s\x1b[0m', formattedMessage); // Green
      break;
    case LogLevel.HTTP:
      console.log('\x1b[35m%s\x1b[0m', formattedMessage); // Magenta
      break;
    case LogLevel.DEBUG:
      console.debug('\x1b[36m%s\x1b[0m', formattedMessage); // Cyan
      break;
  }

  // Also log to file
  try {
    const filePath = path.join(process.cwd(), 'logs', 'application.log');
    fs.appendFileSync(filePath, formattedMessage + '\n');

    // For errors and fatal errors, also log to error-specific file
    if (levelValue === LogLevel.ERROR || levelValue === LogLevel.FATAL) {
      const errorPath = path.join(process.cwd(), 'logs', 'error.log');
      fs.appendFileSync(errorPath, formattedMessage + '\n');
    }
  } catch (error) {
    console.error('Failed to write log to file:', error);
  }
}

// Logger object with methods for each log level
const logger = {
  fatal: (message: string, meta?: unknown) => writeLog(LogLevel.FATAL, 'fatal', message, meta),
  error: (message: string, meta?: unknown) => writeLog(LogLevel.ERROR, 'error', message, meta),
  warn: (message: string, meta?: unknown) => writeLog(LogLevel.WARN, 'warn', message, meta),
  info: (message: string, meta?: unknown) => writeLog(LogLevel.INFO, 'info', message, meta),
  http: (message: string, meta?: unknown) => writeLog(LogLevel.HTTP, 'http', message, meta),
  debug: (message: string, meta?: unknown) => writeLog(LogLevel.DEBUG, 'debug', message, meta),
};

/**
 * Log an error with additional context
 * Properly formats Error objects
 */
export function logError(message: string, error: unknown): void {
  if (error instanceof Error) {
    logger.error(message, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else {
    logger.error(`${message}: ${safeStringify(error)}`);
  }
}

// Export the logger as default
export default logger;
