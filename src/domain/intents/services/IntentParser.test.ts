/**
 * Unit tests for Intent Parser
 *
 * Verifies intent parsing, classification, and validation with Zod schemas.
 */

import { IntentParser } from './IntentParser';
import { IntentSchema } from '../schemas/intent';
import { validateWithZod } from '../../../core/validation/zod-validators';
import { sanitizeError } from '../../../core/errors/sanitize';
import { Intent } from '../entities/Intent';

// Mock dependencies
jest.mock('../../../core/logging/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../../core/validation/zod-validators');
jest.mock('../../../core/errors/sanitize');

describe('IntentParser', () => {
  let parser: IntentParser;

  beforeEach(() => {
    jest.clearAllMocks();
    parser = new IntentParser();

    // Setup default mock implementations
    (validateWithZod as jest.Mock).mockImplementation((schema, data) => {
      // Simple validation mock that passes through the data
      if (schema === IntentSchema) {
        return data;
      }
      throw new Error('Unknown schema');
    });

    (sanitizeError as jest.Mock).mockImplementation((error) =>
      error instanceof Error ? error : new Error(String(error))
    );
  });

  describe('parseIntent', () => {
    test('should correctly identify channel list queries', () => {
      const queries = [
        'show me channels',
        'list all channels',
        'what channels do I have',
        'channel list',
        'all channels',
      ];

      queries.forEach((query) => {
        const result = parser.parseIntent(query);
        expect(result.type).toBe('channel_list');
        expect(result.query).toBe(query);
        expect(validateWithZod).toHaveBeenCalledWith(IntentSchema, expect.any(Object));
      });
    });

    test('should correctly identify channel health queries', () => {
      const queries = ['channel health', 'channel status', 'active channels', 'channel issues'];

      queries.forEach((query) => {
        const result = parser.parseIntent(query);
        expect(result.type).toBe('channel_health');
        expect(result.query).toBe(query);
        expect(validateWithZod).toHaveBeenCalledWith(IntentSchema, expect.any(Object));
      });
    });

    test('should correctly identify channel liquidity queries', () => {
      const queries = [
        'channel balance',
        'channel liquidity',
        'imbalanced channels',
        'local balance',
        'remote balance',
        'liquidity distribution',
        'channel capacity',
      ];

      queries.forEach((query) => {
        const result = parser.parseIntent(query);
        expect(result.type).toBe('channel_liquidity');
        expect(result.query).toBe(query);
        expect(validateWithZod).toHaveBeenCalledWith(IntentSchema, expect.any(Object));
      });
    });

    test('should correctly identify unhealthy channel queries', () => {
      const queries = [
        'show unhealthy channels',
        'unhealthy channels',
        'problematic channels',
        'channels that need attention',
        'channels requiring attention',
        'broken channels',
        'inactive channels',
        'channels with issues',
      ];

      queries.forEach((query) => {
        const result = parser.parseIntent(query);
        expect(result.type).toBe('channel_unhealthy');
        expect(result.query).toBe(query);
        expect(validateWithZod).toHaveBeenCalledWith(IntentSchema, expect.any(Object));
      });
    });

    test('should return unknown for unrecognized queries', () => {
      const queries = [
        'hello world',
        'what is the meaning of life',
        'tell me a joke',
        'lnd info',
        'node status',
      ];

      queries.forEach((query) => {
        const result = parser.parseIntent(query);
        expect(result.type).toBe('unknown');
        expect(result.query).toBe(query);
        expect(validateWithZod).toHaveBeenCalledWith(IntentSchema, expect.any(Object));
      });
    });

    test('should handle validation errors gracefully', () => {
      // Setup validation to fail
      (validateWithZod as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Validation failed');
      });

      const query = 'show me channels';
      const result = parser.parseIntent(query);

      expect(result.type).toBe('unknown');
      expect(result.query).toBe(query);
      expect(result.error).toBeDefined();
      expect(sanitizeError).toHaveBeenCalled();
    });

    test('should prioritize unhealthy over list when both patterns match', () => {
      const query = 'show unhealthy channels';
      const result = parser.parseIntent(query);

      expect(result.type).toBe('channel_unhealthy');
      expect(result.query).toBe(query);
    });

    test('should properly process case-insensitive matches', () => {
      const queries = [
        'SHOW ME CHANNELS',
        'Channel Health',
        'Imbalanced Channels',
        'UnHealthy Channels',
      ];

      const expectedTypes: Intent['type'][] = [
        'channel_list',
        'channel_health',
        'channel_liquidity',
        'channel_unhealthy',
      ];

      queries.forEach((query, index) => {
        const result = parser.parseIntent(query);
        expect(result.type).toBe(expectedTypes[index]);
      });
    });
  });
});
