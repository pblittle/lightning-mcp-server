/**
 * Tests for the Zod-based schema validation functionality.
 *
 * These tests ensure proper validation behavior across schemas
 * and consistency between validation and TypeScript types.
 */

import { z } from 'zod';
import { validateWithZod } from '../../utils/zod-validators';
import { ChannelSchema } from '../../mcp/schemas/channel';
import { ChannelQueryResultSchema } from '../../schemas/channel-response';

describe('Zod Schema Validation', () => {
  describe('validateWithZod function', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      count: z.number().int().positive(),
    });

    it('returns validated data when valid', () => {
      const testData = { name: 'test', count: 5 };
      const result = validateWithZod(TestSchema, testData);
      expect(result).toEqual(testData);
    });

    it('throws formatted error for invalid data', () => {
      const testData = { name: '', count: -5 };
      expect(() => validateWithZod(TestSchema, testData)).toThrow('Validation error:');
    });

    it('includes field paths in error message', () => {
      const testData = { name: '', count: -5 };
      try {
        validateWithZod(TestSchema, testData);
        fail('Should have thrown an error');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('name');
        expect(message).toContain('count');
      }
    });
  });

  describe('ChannelSchema validation', () => {
    it('accepts valid channel data', () => {
      const validChannel = {
        capacity: 1000000,
        local_balance: 500000,
        remote_balance: 500000,
        active: true,
        remote_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
        channel_point: 'txid:0',
      };

      const result = validateWithZod(ChannelSchema, validChannel);
      expect(result).toEqual(validChannel);
    });

    it('accepts channel with optional remote_alias', () => {
      const validChannel = {
        capacity: 1000000,
        local_balance: 500000,
        remote_balance: 500000,
        active: true,
        remote_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
        channel_point: 'txid:0',
        remote_alias: 'ACINQ',
      };

      const result = validateWithZod(ChannelSchema, validChannel);
      expect(result.remote_alias).toBe('ACINQ');
    });

    it('rejects channels with invalid pubkey format', () => {
      const invalidChannel = {
        capacity: 1000000,
        local_balance: 500000,
        remote_balance: 500000,
        active: true,
        remote_pubkey: 'invalid',
        channel_point: 'txid:0',
      };

      expect(() => validateWithZod(ChannelSchema, invalidChannel)).toThrow();
    });

    it('rejects channels with negative balance', () => {
      const invalidChannel = {
        capacity: 1000000,
        local_balance: -500000, // negative value
        remote_balance: 500000,
        active: true,
        remote_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
        channel_point: 'txid:0',
      };

      expect(() => validateWithZod(ChannelSchema, invalidChannel)).toThrow();
    });
  });

  describe('ChannelQueryResultSchema validation', () => {
    it('validates a complete query result', () => {
      const validQueryResult = {
        channels: [
          {
            capacity: 1000000,
            local_balance: 500000,
            remote_balance: 500000,
            active: true,
            remote_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
            channel_point: 'txid:0',
            remote_alias: 'ACINQ',
          },
        ],
        summary: {
          totalCapacity: 1000000,
          totalLocalBalance: 500000,
          totalRemoteBalance: 500000,
          activeChannels: 1,
          inactiveChannels: 0,
          averageCapacity: 1000000,
          healthyChannels: 1,
          unhealthyChannels: 0,
        },
      };

      const result = validateWithZod(ChannelQueryResultSchema, validQueryResult);
      expect(result.channels).toHaveLength(1);
      expect(result.summary.totalCapacity).toBe(1000000);
    });

    it('rejects if summary statistics are inconsistent', () => {
      const invalidQueryResult = {
        channels: [
          {
            capacity: 1000000,
            local_balance: 500000,
            remote_balance: 500000,
            active: true,
            remote_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
            channel_point: 'txid:0',
          },
        ],
        summary: {
          totalCapacity: -1, // Invalid negative value
          totalLocalBalance: 500000,
          totalRemoteBalance: 500000,
          activeChannels: 1,
          inactiveChannels: 0,
          averageCapacity: 1000000,
          healthyChannels: 1,
          unhealthyChannels: 0,
        },
      };

      expect(() => validateWithZod(ChannelQueryResultSchema, invalidQueryResult)).toThrow();
    });
  });
});
