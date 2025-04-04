/**
 * Unit tests for Lightning error classes
 */

import {
  LightningError,
  LightningErrorCode,
  ConnectionError,
  AuthenticationError,
  CredentialError,
  QueryError,
  ChannelError,
} from '../LightningErrors';

// We're not testing sanitization here since that's tested in the BaseError tests
jest.mock('../../../core/errors/sanitize', () => ({
  sanitizeErrorMessage: jest.fn((msg) => msg),
  sanitizeForLogging: jest.fn((obj) => obj),
}));

describe('Lightning Errors', () => {
  describe('LightningError', () => {
    it('should create a base lightning error with default code', () => {
      const error = new LightningError('generic lightning error');

      expect(error.message).toBe('generic lightning error');
      expect(error.code).toBe(LightningErrorCode.UNKNOWN_ERROR);
      expect(error.name).toBe('LightningError');
    });

    it('should set custom error code', () => {
      const error = new LightningError('custom error', {
        code: LightningErrorCode.NODE_UNAVAILABLE,
      });

      expect(error.code).toBe(LightningErrorCode.NODE_UNAVAILABLE);
    });

    it('should preserve metadata and cause', () => {
      const cause = new Error('original error');
      const metadata = { nodeId: '123', timestamp: Date.now() };

      const error = new LightningError('error with context', {
        code: LightningErrorCode.INTERNAL_ERROR,
        metadata,
        cause,
      });

      expect(error.metadata).toEqual(metadata);
      expect(error.cause).toBe(cause);
    });
  });

  describe('MCP Error Mapping', () => {
    it('should map connection errors to PROVIDER_CONNECTION_ERROR', () => {
      const connectionError = new ConnectionError('connection failed');
      const mcpError = connectionError.toMcpError();

      expect(mcpError.code).toBe('PROVIDER_CONNECTION_ERROR');
      expect(mcpError.message).toBe('connection failed');
      expect(mcpError.details.originalCode).toBe(LightningErrorCode.CONNECTION_FAILED);
    });

    it('should map query errors to PROVIDER_QUERY_ERROR', () => {
      const queryError = new QueryError('query failed');
      const mcpError = queryError.toMcpError();

      expect(mcpError.code).toBe('PROVIDER_QUERY_ERROR');
      expect(mcpError.message).toBe('query failed');
      expect(mcpError.details.originalCode).toBe(LightningErrorCode.QUERY_FAILED);
    });

    it('should map channel errors to RESOURCE_NOT_FOUND', () => {
      const channelError = new ChannelError('channel not found');
      const mcpError = channelError.toMcpError();

      expect(mcpError.code).toBe('RESOURCE_NOT_FOUND');
      expect(mcpError.message).toBe('channel not found');
      expect(mcpError.details.originalCode).toBe(LightningErrorCode.CHANNEL_NOT_FOUND);
    });

    it('should map node errors to SERVICE_UNAVAILABLE', () => {
      const nodeError = new LightningError('node offline', {
        code: LightningErrorCode.NODE_UNAVAILABLE,
      });
      const mcpError = nodeError.toMcpError();

      expect(mcpError.code).toBe('SERVICE_UNAVAILABLE');
      expect(mcpError.message).toBe('node offline');
      expect(mcpError.details.originalCode).toBe(LightningErrorCode.NODE_UNAVAILABLE);
    });

    it('should map unknown errors to INTERNAL_SERVER_ERROR', () => {
      const unknownError = new LightningError('unknown error');
      const mcpError = unknownError.toMcpError();

      expect(mcpError.code).toBe('INTERNAL_SERVER_ERROR');
      expect(mcpError.message).toBe('unknown error');
      expect(mcpError.details.originalCode).toBe(LightningErrorCode.UNKNOWN_ERROR);
    });

    it('should include custom metadata in MCP error details', () => {
      const metadata = { requestId: '12345', endpoint: '/api/resource' };
      const error = new QueryError('query failed with context', { metadata });
      const mcpError = error.toMcpError();

      expect(mcpError.details).toEqual({
        originalCode: LightningErrorCode.QUERY_FAILED,
        requestId: '12345',
        endpoint: '/api/resource',
      });
    });
  });

  describe('Specialized Error Classes', () => {
    it('should create a ConnectionError with appropriate default code', () => {
      const error = new ConnectionError('connection failed');

      expect(error.message).toBe('connection failed');
      expect(error.code).toBe(LightningErrorCode.CONNECTION_FAILED);
      expect(error.name).toBe('ConnectionError');
    });

    it('should create an AuthenticationError with appropriate default code', () => {
      const error = new AuthenticationError('authentication failed');

      expect(error.message).toBe('authentication failed');
      expect(error.code).toBe(LightningErrorCode.AUTHENTICATION_FAILED);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create a CredentialError with appropriate default code', () => {
      const error = new CredentialError('invalid credentials');

      expect(error.message).toBe('invalid credentials');
      expect(error.code).toBe(LightningErrorCode.INVALID_CREDENTIALS);
      expect(error.name).toBe('CredentialError');
    });

    it('should create a QueryError with appropriate default code', () => {
      const error = new QueryError('query failed');

      expect(error.message).toBe('query failed');
      expect(error.code).toBe(LightningErrorCode.QUERY_FAILED);
      expect(error.name).toBe('QueryError');
    });

    it('should create a ChannelError with appropriate default code', () => {
      const error = new ChannelError('channel not found');

      expect(error.message).toBe('channel not found');
      expect(error.code).toBe(LightningErrorCode.CHANNEL_NOT_FOUND);
      expect(error.name).toBe('ChannelError');
    });

    it('should allow overriding the default code in specialized errors', () => {
      const error = new QueryError('unsupported query', {
        code: LightningErrorCode.UNSUPPORTED_QUERY,
      });

      expect(error.code).toBe(LightningErrorCode.UNSUPPORTED_QUERY);
    });
  });
});
