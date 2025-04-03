/**
 * Unit tests for BaseError class
 */

import { BaseError } from './base-error';
import * as sanitizeModule from './sanitize';

// Mock the sanitize functions
jest.mock('./sanitize', () => ({
  sanitizeErrorMessage: jest.fn((msg) => `sanitized:${msg}`),
  sanitizeForLogging: jest.fn((obj) => ({ ...obj, sanitized: true })),
}));

describe('BaseError', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it('should create an error with a sanitized message', () => {
    const error = new BaseError('test message');

    // Should sanitize the message
    expect(sanitizeModule.sanitizeErrorMessage).toHaveBeenCalledWith('test message');
    expect(error.message).toBe('sanitized:test message');

    // Should set the name to the constructor name
    expect(error.name).toBe('BaseError');

    // Should have a stack trace
    expect(error.stack).toBeDefined();
  });

  it('should handle error options', () => {
    const metadata = { request: { id: '123' }, context: 'test' };
    const cause = new Error('original error');
    const error = new BaseError('test message', {
      code: 'TEST_ERROR',
      metadata,
      cause,
    });

    // Should set the code
    expect(error.code).toBe('TEST_ERROR');

    // Should sanitize the metadata
    expect(sanitizeModule.sanitizeForLogging).toHaveBeenCalledWith(metadata);
    expect(error.metadata).toEqual({ ...metadata, sanitized: true });

    // Should set the cause
    expect(error.cause).toBe(cause);
  });

  it('should provide a default MCP error mapping', () => {
    const error = new BaseError('test message', {
      code: 'TEST_ERROR',
      metadata: { foo: 'bar' },
    });

    const mcpError = error.toMcpError();

    expect(mcpError).toEqual({
      code: 'TEST_ERROR',
      message: 'sanitized:test message',
      details: { foo: 'bar', sanitized: true },
    });
  });

  it('should use INTERNAL_ERROR as default error code', () => {
    const error = new BaseError('test message');
    const mcpError = error.toMcpError();

    expect(mcpError.code).toBe('INTERNAL_ERROR');
  });

  it('should serialize to JSON properly', () => {
    const error = new BaseError('test message', {
      code: 'TEST_ERROR',
      metadata: { foo: 'bar' },
      cause: new Error('original error'),
    });

    const json = error.toJSON();

    // Should include name, message, code, and metadata
    expect(json).toEqual({
      name: 'BaseError',
      message: 'sanitized:test message',
      code: 'TEST_ERROR',
      metadata: { foo: 'bar', sanitized: true },
    });

    // Should NOT include stack or cause for security
    expect(json.stack).toBeUndefined();
    expect(json.cause).toBeUndefined();
  });
});
