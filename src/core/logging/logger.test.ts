/**
 * Unit tests for logger module
 */

import pino from 'pino';
import { logger, sanitizeHeaders } from './logger';
import { sanitizeError } from '../errors/sanitize';

// Mock dependencies
jest.mock('../errors/sanitize', () => ({
  sanitizeError: jest.fn().mockImplementation((err) => {
    const sanitizedError = new Error(`Sanitized: ${err.message}`);
    // We'll add the property at runtime instead of declaring it on the type
    Object.defineProperty(sanitizedError, 'isSanitized', {
      value: true,
      configurable: true,
      enumerable: true,
      writable: true,
    });
    return sanitizedError;
  }),
  sanitizeForLogging: jest.fn().mockImplementation((data) => data),
}));

// Mock pino with required properties
jest.mock('pino', () => {
  const mockPino = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn().mockImplementation(() => mockPino),
    stdTimeFunctions: {
      isoTime: jest.fn(),
    },
    levels: {
      silent: 100,
      debug: 20,
    },
    level: 30, // info level
  };

  // Return a mock function that itself returns mockPino
  const mockPinoFn = jest.fn().mockImplementation(() => mockPino) as jest.Mock & {
    stdTimeFunctions: { isoTime: jest.Mock };
  };

  // Add required properties to the function object
  mockPinoFn.stdTimeFunctions = {
    isoTime: jest.fn(),
  };

  return mockPinoFn;
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Log Level Methods', () => {
    it('should call pino logger with sanitized parameters for info level', () => {
      const mockPino = pino();
      logger.info('Test info message');

      expect(mockPino.info).toHaveBeenCalledWith({}, 'Test info message');
    });

    it('should call pino logger with sanitized metadata for info level', () => {
      const mockPino = pino();
      const metadata = { requestId: '123', user: 'test', token: 'sensitive-value' };

      logger.info('Test info with metadata', metadata);

      // We're mocking sanitizeForLogging, so we expect it to be called but not modify the values in test
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '123',
          user: 'test',
        }),
        'Test info with metadata'
      );
    });

    it('should call pino logger with sanitized parameters for debug level', () => {
      const mockPino = pino();
      logger.debug('Test debug message');

      expect(mockPino.debug).toHaveBeenCalledWith({}, 'Test debug message');
    });

    it('should call pino logger with sanitized parameters for warn level', () => {
      const mockPino = pino();
      logger.warn('Test warning message');

      expect(mockPino.warn).toHaveBeenCalledWith({}, 'Test warning message');
    });

    it('should call pino logger with sanitized error for error level with Error object', () => {
      const mockPino = pino();
      const err = new Error('Test error with sensitive data');

      logger.error('Error occurred', err);

      // Verify that sanitizeError was called on the error
      expect(sanitizeError).toHaveBeenCalledWith(err);
      expect(mockPino.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: 'Sanitized: Test error with sensitive data',
          }),
        }),
        'Error occurred'
      );
    });

    it('should call pino logger with sanitized metadata for error level with metadata', () => {
      const mockPino = pino();
      const metadata = { requestId: '123', component: 'test', secret: 'abc123' };

      logger.error('Error with metadata', metadata);

      expect(mockPino.error).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '123',
          component: 'test',
        }),
        'Error with metadata'
      );
    });

    it('should call pino logger with sanitized error and metadata for error level with both', () => {
      const mockPino = pino();
      const err = new Error('Test error with token: secret123');
      const metadata = { requestId: '123', component: 'test', apiKey: 'xyz789' };

      logger.error('Error with context', err, metadata);

      // Verify error is sanitized
      expect(sanitizeError).toHaveBeenCalledWith(err);

      // Verify metadata is also sanitized and both are passed to pino
      expect(mockPino.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: 'Sanitized: Test error with token: secret123',
          }),
          requestId: '123',
          component: 'test',
        }),
        'Error with context'
      );
    });

    it('should call pino logger with sanitized error for fatal level', () => {
      const mockPino = pino();
      const err = new Error('Fatal error with certificate: /path/to/cert.pem');

      logger.fatal('Critical failure', err);

      // Verify error is sanitized
      expect(sanitizeError).toHaveBeenCalledWith(err);

      expect(mockPino.fatal).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: 'Sanitized: Fatal error with certificate: /path/to/cert.pem',
          }),
        }),
        'Critical failure'
      );
    });
  });

  describe('Child Loggers', () => {
    it('should create a child logger with sanitized bindings', () => {
      const mockPino = pino();
      const childLogger = logger.child({
        component: 'TestComponent',
        requestId: '456',
        secret: 'child-secret',
      });

      // Verify bindings are sanitized before creating child logger
      expect(mockPino.child).toHaveBeenCalledWith(
        expect.objectContaining({
          component: 'TestComponent',
          requestId: '456',
        })
      );
      expect(childLogger).toBeDefined();
    });

    it('should use child logger correctly for info messages with sanitization', () => {
      const mockPino = pino();
      const childLogger = logger.child({ component: 'TestComponent' });

      childLogger.info('Child logger info');

      // child() returns the mock itself in our test setup
      expect(mockPino.info).toHaveBeenCalledWith({}, 'Child logger info');
    });

    it('should use child logger correctly with sanitized additional metadata', () => {
      const mockPino = pino();
      const childLogger = logger.child({ component: 'TestComponent' });

      childLogger.info('Child logger with metadata', {
        requestId: '789',
        credential: 'super-secret',
      });

      // Metadata should be sanitized
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: '789' }),
        'Child logger with metadata'
      );
    });

    it('should use child logger correctly for error messages with sanitized Error object', () => {
      const mockPino = pino();
      const childLogger = logger.child({ component: 'TestComponent' });
      const err = new Error('Child logger error with password: xyz123');

      childLogger.error('Error in component', err);

      // Error should be sanitized
      expect(sanitizeError).toHaveBeenCalledWith(err);

      expect(mockPino.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: 'Sanitized: Child logger error with password: xyz123',
          }),
        }),
        'Error in component'
      );
    });
  });

  describe('Header Sanitization', () => {
    it('should sanitize sensitive headers', () => {
      const headers = {
        authorization: 'Bearer token123',
        cookie: 'session=abc',
        'x-lnd-macaroon': 'abcdef123456',
        'content-type': 'application/json',
        accept: 'application/json',
        credential: 'mysecret',
        cert: '/path/to/cert.pem',
        secret: 'hidden-value',
      };

      const sanitized = sanitizeHeaders(headers);

      // Sensitive headers should be redacted
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.cookie).toBe('[REDACTED]');
      expect(sanitized['x-lnd-macaroon']).toBe('[REDACTED]');
      expect(sanitized.credential).toBe('[REDACTED]');
      expect(sanitized.cert).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');

      // Non-sensitive headers should be unchanged
      expect(sanitized['content-type']).toBe('application/json');
      expect(sanitized.accept).toBe('application/json');
    });

    it('should handle null or missing headers', () => {
      expect(sanitizeHeaders({})).toEqual({});
      expect(sanitizeHeaders({ normal: 'value' })).toEqual({ normal: 'value' });
    });
  });
});
