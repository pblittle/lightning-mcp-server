/**
 * src/__tests__/mcp/utils.test.ts
 *
 * Tests for MCP utility functions
 */

import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { determineErrorCode, parseBooleanEnv } from '../../mcp/utils';

describe('MCP Utils', () => {
  describe('determineErrorCode', () => {
    test('should return InvalidParams for parameter-related errors', () => {
      // Error objects
      expect(determineErrorCode(new Error('Invalid parameter: query'))).toBe(
        ErrorCode.InvalidParams
      );
      expect(determineErrorCode(new Error('This action is not allowed'))).toBe(
        ErrorCode.InvalidParams
      );

      // String errors
      expect(determineErrorCode('Missing required parameter')).toBe(ErrorCode.InvalidParams);
      expect(determineErrorCode('The operation is not allowed in this context')).toBe(
        ErrorCode.InvalidParams
      );
    });

    test('should return MethodNotFound for not found errors', () => {
      // Error objects
      expect(determineErrorCode(new Error('Tool not found: xyz'))).toBe(ErrorCode.MethodNotFound);
      expect(determineErrorCode(new Error('Unknown command: test'))).toBe(ErrorCode.MethodNotFound);

      // String errors
      expect(determineErrorCode('Resource not found')).toBe(ErrorCode.MethodNotFound);
      expect(determineErrorCode('This is an unknown command')).toBe(ErrorCode.MethodNotFound);
    });

    test('should return InvalidRequest for authorization errors', () => {
      // Error objects
      expect(determineErrorCode(new Error('Unauthorized access'))).toBe(ErrorCode.InvalidRequest);
      expect(determineErrorCode(new Error('Permission denied'))).toBe(ErrorCode.InvalidRequest);

      // String errors
      expect(determineErrorCode('You are not authorized to access this')).toBe(
        ErrorCode.InvalidRequest
      );
      expect(determineErrorCode('Permission denied for this operation')).toBe(
        ErrorCode.InvalidRequest
      );
    });

    test('should return InternalError for other errors', () => {
      // Error objects
      expect(determineErrorCode(new Error('Something went wrong'))).toBe(ErrorCode.InternalError);
      expect(determineErrorCode(new Error('Unexpected error'))).toBe(ErrorCode.InternalError);

      // String errors
      expect(determineErrorCode('Connection timeout')).toBe(ErrorCode.InternalError);
      expect(determineErrorCode('Database error')).toBe(ErrorCode.InternalError);

      // Other types
      expect(determineErrorCode(null)).toBe(ErrorCode.InternalError);
      expect(determineErrorCode(undefined)).toBe(ErrorCode.InternalError);
      expect(determineErrorCode(42)).toBe(ErrorCode.InternalError);
    });
  });

  describe('parseBooleanEnv', () => {
    test('should return default value when input is undefined', () => {
      expect(parseBooleanEnv(undefined, true)).toBe(true);
      expect(parseBooleanEnv(undefined, false)).toBe(false);
    });

    test('should return true for "true", "1", and "yes" (case insensitive)', () => {
      expect(parseBooleanEnv('true', false)).toBe(true);
      expect(parseBooleanEnv('TRUE', false)).toBe(true);
      expect(parseBooleanEnv('True', false)).toBe(true);

      expect(parseBooleanEnv('1', false)).toBe(true);

      expect(parseBooleanEnv('yes', false)).toBe(true);
      expect(parseBooleanEnv('YES', false)).toBe(true);
      expect(parseBooleanEnv('Yes', false)).toBe(true);
    });

    test('should return false for any other string values', () => {
      expect(parseBooleanEnv('false', true)).toBe(false);
      expect(parseBooleanEnv('0', true)).toBe(false);
      expect(parseBooleanEnv('no', true)).toBe(false);

      expect(parseBooleanEnv('', true)).toBe(false);
      expect(parseBooleanEnv('maybe', true)).toBe(false);
      expect(parseBooleanEnv('enabled', true)).toBe(false);
      expect(parseBooleanEnv('disabled', true)).toBe(false);
      expect(parseBooleanEnv('any other string', true)).toBe(false);
    });
  });
});
