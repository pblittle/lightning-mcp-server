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

  // Check for invalid parameter errors
  if (
    lowerMessage.includes('parameter') ||
    lowerMessage.includes('param') ||
    lowerMessage.includes('not allowed') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('missing')
  ) {
    return ErrorCode.InvalidParams;
  }

  // Check for method/resource not found errors
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('unknown') ||
    lowerMessage.includes('command')
  ) {
    return ErrorCode.MethodNotFound;
  }

  // Check for authorization/permission errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('denied') ||
    lowerMessage.includes('auth')
  ) {
    return ErrorCode.InvalidRequest;
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
