import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import logger from '../utils/logger';
import { sanitizeErrorMessage } from '../utils/sanitize';

/**
 * Format error for MCP response
 * @param error Error object or string
 * @param context Additional context for the error
 * @returns Formatted error message
 */
export function formatError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const sanitizedMessage = sanitizeErrorMessage(errorMessage);
  return `${context}: ${sanitizedMessage}`;
}

/**
 * Create an MCP error with proper error code
 * @param error Error object or string
 * @param context Additional context for the error
 * @returns MCP error object
 */
export function createMcpError(error: unknown, context: string): McpError {
  const errorMessage = formatError(error, context);

  // Log the error with sanitized message
  logger.error(errorMessage, {
    error: {
      message: sanitizeErrorMessage(error instanceof Error ? error.message : String(error)),
    },
    context,
  });

  // Determine the appropriate error code
  let errorCode = ErrorCode.InternalError;

  if (errorMessage.includes('not allowed') || errorMessage.includes('invalid parameter')) {
    errorCode = ErrorCode.InvalidParams;
  } else if (errorMessage.includes('not found') || errorMessage.includes('unknown command')) {
    errorCode = ErrorCode.MethodNotFound;
  } else if (errorMessage.includes('unauthorized') || errorMessage.includes('permission denied')) {
    // Use InvalidRequest for authorization errors since Unauthorized is not available
    errorCode = ErrorCode.InvalidRequest;
  }

  return new McpError(errorCode, errorMessage);
}

/**
 * Format a response object for consistent output
 * @param data Data to format
 * @returns Formatted data as a string
 */
export function formatResponse(data: any): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    const sanitizedError = sanitizeErrorMessage(
      error instanceof Error ? error.message : String(error)
    );
    logger.error('Failed to format response', { error: { message: sanitizedError } });
    return String(data);
  }
}

/**
 * Sanitize sensitive data for logging
 * @param data Data to sanitize
 * @returns Sanitized data
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  // List of sensitive fields to redact
  const sensitiveFields = [
    'macaroon',
    'password',
    'secret',
    'token',
    'key',
    'cert',
    'credential',
    'auth',
  ];

  // Redact sensitive fields
  for (const field of Object.keys(sanitized)) {
    if (sensitiveFields.some((sensitive) => field.toLowerCase().includes(sensitive))) {
      sanitized[field] = '[REDACTED]';
    } else if (typeof sanitized[field] === 'object' && sanitized[field] !== null) {
      sanitized[field] = sanitizeForLogging(sanitized[field]);
    }
  }

  return sanitized;
}

/**
 * Parse boolean environment variable
 * @param value Environment variable value
 * @param defaultValue Default value if not set
 * @returns Parsed boolean value
 */
export function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ['true', '1', 'yes'].includes(value.toLowerCase());
}
