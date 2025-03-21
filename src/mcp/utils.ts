/**
 * src/mcp/utils.ts
 *
 * Utility functions specific to MCP protocol handling
 */

import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Determine appropriate MCP error code based on error message content
 *
 * @param error - The original error object or string
 * @returns ErrorCode from MCP SDK
 */
export function determineErrorCode(error: unknown): ErrorCode {
  // Handle null/undefined
  if (!error) {
    return ErrorCode.InternalError;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Prioritize more specific error conditions first

  // Authentication and authorization errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('not allowed to')
  ) {
    return ErrorCode.InvalidRequest;
  }

  // Method/resource not found errors
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('unknown method') ||
    lowerMessage.includes('unknown command') ||
    lowerMessage.includes('undefined method')
  ) {
    return ErrorCode.MethodNotFound;
  }

  // Parse errors
  if (
    lowerMessage.includes('parse error') ||
    lowerMessage.includes('parsing failed') ||
    lowerMessage.includes('invalid json') ||
    lowerMessage.includes('syntax error')
  ) {
    return ErrorCode.ParseError;
  }

  // Invalid parameter errors - check this after more specific conditions
  if (
    lowerMessage.includes('parameter') ||
    lowerMessage.includes('param') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('missing') ||
    lowerMessage.includes('not allowed')
  ) {
    return ErrorCode.InvalidParams;
  }

  // Server errors
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('overloaded') ||
    lowerMessage.includes('unavailable') ||
    lowerMessage.includes('internal server error')
  ) {
    return ErrorCode.InternalError;
  }

  // Default to internal error
  return ErrorCode.InternalError;
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
