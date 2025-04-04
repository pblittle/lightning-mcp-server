/**
 * Unit tests for LightningMcpController
 */

import { LightningMcpController } from './LightningMcpController';
import { LightningQueryProcessor } from '../../application/processors/LightningQueryProcessor';
import { LightningError, LightningErrorCode } from '../../domain/errors/LightningErrors';
import { sanitizeError, sanitizeForLogging } from '../../core/errors/sanitize';

// Mock dependencies
jest.mock('../../application/processors/LightningQueryProcessor');
jest.mock('../../core/logging/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../core/errors/sanitize', () => ({
  sanitizeError: jest.fn().mockImplementation((err) => {
    // Simple mock that preserves error type and code but sanitizes the message
    if (err instanceof Error) {
      const sanitized = new Error(`Sanitized: ${err.message}`);
      // Copy properties for BaseError instances
      if ('code' in err) {
        (sanitized as any).code = err.code;
      }
      return sanitized;
    }
    return new Error('Unknown error');
  }),
  sanitizeForLogging: jest.fn().mockImplementation((data) => {
    // Simple mock that returns a safe copy
    if (typeof data === 'object' && data !== null) {
      return { ...data, sanitized: true };
    }
    return data;
  }),
  sanitizeErrorMessage: jest.fn().mockImplementation((msg) => {
    // Simple mock that preserves the message format but adds "Sanitized:" prefix
    return msg ? `Sanitized: ${msg}` : msg;
  }),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-12345'),
}));

// Interface for test channel data
interface TestChannel {
  capacity: number;
  local_balance: number;
  remote_balance: number;
  active: boolean;
  remote_pubkey: string;
  channel_point: string;
  remote_alias?: string;
  // Add a test property for cert_path
  test_cert_path?: string;
}

// Interface for test summary data
interface TestSummary {
  totalCapacity: number;
  totalLocalBalance: number;
  totalRemoteBalance: number;
  activeChannels: number;
  inactiveChannels: number;
  // Add a test property for credentials
  test_credentials?: {
    macaroon: string;
  };
}

describe('LightningMcpController', () => {
  let controller: LightningMcpController;
  let mockQueryProcessor: jest.Mocked<LightningQueryProcessor>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a properly mocked instance with constructor args
    const mockIntentParser = {};
    const mockHandlerRegistry = {};
    mockQueryProcessor = new LightningQueryProcessor(
      mockIntentParser as any,
      mockHandlerRegistry as any
    ) as jest.Mocked<LightningQueryProcessor>;

    controller = new LightningMcpController(mockQueryProcessor);
  });

  describe('executeQuery', () => {
    it('should process query and return formatted result', async () => {
      // Setup mock query processor response
      mockQueryProcessor.processQuery.mockResolvedValue({
        text: 'Channel balance: 1,000,000 sats',
        data: {
          channels: [
            {
              capacity: 1000000,
              local_balance: 500000,
              remote_balance: 500000,
              active: true,
              remote_pubkey: '123abc',
              channel_point: 'txid:0',
              remote_alias: 'Test Node',
            },
          ],
          summary: {
            totalCapacity: 1000000,
            totalLocalBalance: 500000,
            totalRemoteBalance: 500000,
            activeChannels: 1,
            inactiveChannels: 0,
          },
        },
        intent: {
          domain: 'channels',
          operation: 'liquidity',
          query: 'What is the balance of channel 123?',
          attributes: new Map([['channelId', '123']]),
        },
      });

      // Execute the query
      const result = await controller.executeQuery('What is the balance of channel 123?');

      // Verify query processor was called with the input
      expect(mockQueryProcessor.processQuery).toHaveBeenCalledWith(
        'What is the balance of channel 123?'
      );

      // Verify sanitizeForLogging was called when logging
      expect(sanitizeForLogging).toHaveBeenCalled();

      // Verify result formatting contains expected content
      expect(result.content).toEqual([{ type: 'text', text: 'Channel balance: 1,000,000 sats' }]);

      // Verify the data contains channel information
      expect(result).toHaveProperty('data');

      // Type assertions for TypeScript
      const data = result.data as { channels: Array<{ capacity: number }> };
      expect(data.channels[0].capacity).toBe(1000000);

      // The isError property should be defined and false
      expect(result).toHaveProperty('isError', false);
    });

    it('should handle BaseError by sanitizing and preserving error code', async () => {
      // Mock sanitizeErrorMessage to avoid duplicate sanitization
      const mockSanitizeErrorMessage = require('../../core/errors/sanitize')
        .sanitizeErrorMessage as jest.Mock;
      mockSanitizeErrorMessage.mockImplementationOnce((msg) => msg);

      // Setup mock with a domain error - avoid double sanitization in the test
      const errorMsg = 'Channel not found with connection string: lnc1:abc123';
      const domainError = new LightningError(errorMsg, {
        code: LightningErrorCode.CHANNEL_NOT_FOUND,
        metadata: { channelId: '123', connectionString: 'lnc1:sensitive-data' },
      });
      mockQueryProcessor.processQuery.mockRejectedValue(domainError);

      // Mock sanitizeError to return expected test value
      const mockSanitizeError = require('../../core/errors/sanitize').sanitizeError as jest.Mock;
      mockSanitizeError.mockImplementationOnce((err) => {
        if (err instanceof Error) {
          const sanitized = new Error(`Sanitized: ${errorMsg}`);
          if ('code' in err) {
            (sanitized as any).code = err.code;
          }
          return sanitized;
        }
        return new Error('Unknown error');
      });

      // Execute the query that will fail
      const result = await controller.executeQuery('Get channel 123');

      // Verify sanitizeError was called with the original error
      expect(sanitizeError).toHaveBeenCalledWith(domainError);

      // Verify error result contains proper code and format
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Sanitized: Channel not found with connection string: lnc1:abc123',
          },
        ],
        data: {
          error: 'Sanitized: Channel not found with connection string: lnc1:abc123',
          code: LightningErrorCode.CHANNEL_NOT_FOUND,
        },
        isError: true,
      });
    });

    it('should handle standard Error with sanitization', async () => {
      // Setup mock with a standard error containing sensitive data
      const standardError = new Error('Something went wrong with certificate at /path/to/cert.pem');
      mockQueryProcessor.processQuery.mockRejectedValue(standardError);

      // Execute the query that will fail
      const result = await controller.executeQuery('Get channel 123');

      // Verify sanitizeError was called with the original error
      expect(sanitizeError).toHaveBeenCalledWith(standardError);

      // Verify error result has sanitized format
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: "Error: I couldn't process your query: Sanitized: Something went wrong with certificate at /path/to/cert.pem",
          },
        ],
        data: {
          error: 'Sanitized: Something went wrong with certificate at /path/to/cert.pem',
        },
        isError: true,
      });
    });

    it('should log query execution with sanitized context', async () => {
      // Setup successful query response with sensitive data - using type annotations
      const testChannels: TestChannel[] = [
        {
          capacity: 1000000,
          local_balance: 500000,
          remote_balance: 500000,
          active: true,
          remote_pubkey: 'abc123',
          channel_point: 'txid:1',
          remote_alias: 'Node 1',
          test_cert_path: '/home/user/cert.pem', // Sensitive data as test property
        },
        {
          capacity: 2000000,
          local_balance: 1000000,
          remote_balance: 1000000,
          active: true,
          remote_pubkey: 'def456',
          channel_point: 'txid:2',
          remote_alias: 'Node 2',
        },
        {
          capacity: 3000000,
          local_balance: 1500000,
          remote_balance: 1500000,
          active: true,
          remote_pubkey: 'ghi789',
          channel_point: 'txid:3',
          remote_alias: 'Node 3',
        },
      ];

      const testSummary: TestSummary = {
        totalCapacity: 6000000,
        totalLocalBalance: 3000000,
        totalRemoteBalance: 3000000,
        activeChannels: 3,
        inactiveChannels: 0,
        test_credentials: {
          macaroon: '/path/to/admin.macaroon', // Sensitive data as test property
        },
      };

      mockQueryProcessor.processQuery.mockResolvedValue({
        text: 'Channel list: 1, 2, 3',
        data: {
          channels: testChannels,
          summary: testSummary,
        },
        intent: {
          domain: 'channels',
          operation: 'list',
          query: 'List all channels',
          attributes: new Map(),
        },
      });

      // Import logger to verify calls
      const logger = require('../../core/logging/logger').default;

      // Execute the query
      await controller.executeQuery('List all channels');

      // Verify logging occurred with correct parameters
      expect(logger.info).toHaveBeenCalledWith(
        'Executing Lightning Network query',
        expect.objectContaining({
          component: 'lightning-mcp-controller',
          query: 'List all channels',
        })
      );

      // Verify sanitizeForLogging was called with the result data
      expect(sanitizeForLogging).toHaveBeenCalled();

      // Verify successful execution was logged with sanitized data
      expect(logger.info).toHaveBeenCalledWith(
        'Successfully processed query',
        expect.objectContaining({
          component: 'lightning-mcp-controller',
          intentDomain: 'channels',
          intentOperation: 'list',
          resultData: expect.objectContaining({ sanitized: true }),
        })
      );
    });

    it('should log errors with sanitized enhanced context', async () => {
      // Mock sanitizeErrorMessage to avoid duplicate sanitization
      const mockSanitizeErrorMessage = require('../../core/errors/sanitize')
        .sanitizeErrorMessage as jest.Mock;
      mockSanitizeErrorMessage.mockImplementationOnce((msg) => msg);

      // Setup mock with a domain error containing sensitive info
      const errorMsg = 'Node connection failed with socket at /var/run/lnd.sock';
      const domainError = new LightningError(errorMsg, {
        code: LightningErrorCode.NODE_UNAVAILABLE,
        metadata: {
          host: 'localhost',
          port: 10009,
          certPath: '/home/user/tls.cert', // Sensitive
          macaroonPath: '/home/user/.lnd/admin.macaroon', // Sensitive
        },
      });
      mockQueryProcessor.processQuery.mockRejectedValue(domainError);

      // Mock sanitizeError to return expected test value
      const mockSanitizeError = require('../../core/errors/sanitize').sanitizeError as jest.Mock;
      mockSanitizeError.mockImplementationOnce((err) => {
        if (err instanceof Error) {
          const sanitized = new Error(`Sanitized: ${errorMsg}`);
          if ('code' in err) {
            (sanitized as any).code = err.code;
          }
          return sanitized;
        }
        return new Error('Unknown error');
      });

      // Import logger to verify calls
      const logger = require('../../core/logging/logger').default;

      // Execute the query that will fail
      await controller.executeQuery('Get node status');

      // Verify sanitizeError was called with the original error
      expect(sanitizeError).toHaveBeenCalledWith(domainError);

      // Verify error was logged with sanitized content
      expect(logger.error).toHaveBeenCalledWith(
        'Error executing Lightning Network query',
        expect.anything(), // The sanitized error
        expect.objectContaining({
          component: 'lightning-mcp-controller',
          query: 'Get node status',
          errorType: 'Error', // After sanitization
          errorCode: LightningErrorCode.NODE_UNAVAILABLE,
        })
      );
    });
  });
});
