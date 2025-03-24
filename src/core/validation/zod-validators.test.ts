/**
 * Unit tests for Zod validators.
 * Tests validator behavior to ensure proper validation of Lightning Network data.
 */

import { z } from 'zod';
import {
  pubkeyValidator,
  satoshiValidator,
  resourceIdValidator,
  validateWithZod,
} from './zod-validators';

describe('Zod Validators', () => {
  describe('pubkeyValidator', () => {
    it('accepts valid 66-character public keys', () => {
      const validKey = '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f';
      expect(pubkeyValidator.safeParse(validKey).success).toBe(true);
    });

    it('accepts test environment keys of sufficient length', () => {
      const testKey = '0123456789abcdef'; // 16 characters
      expect(pubkeyValidator.safeParse(testKey).success).toBe(true);
    });

    it('rejects empty public keys', () => {
      expect(pubkeyValidator.safeParse('').success).toBe(false);
    });

    it('rejects short invalid public keys', () => {
      // Too short for either condition
      expect(pubkeyValidator.safeParse('invalid')).toEqual(
        expect.objectContaining({ success: false })
      );

      // Less than 16 chars and not proper hex format
      const shortInvalidKey = 'abc123';
      expect(pubkeyValidator.safeParse(shortInvalidKey).success).toBe(false);
    });

    // Note: The current implementation allows long keys (≥16 chars) even with non-hex chars
    it('accepts long keys regardless of format for test environments', () => {
      const longNonHexKey = '0386zzz025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f';
      expect(pubkeyValidator.safeParse(longNonHexKey).success).toBe(true);
    });
  });

  describe('satoshiValidator', () => {
    it('accepts valid satoshi amounts', () => {
      expect(satoshiValidator.safeParse(1000).success).toBe(true);
      expect(satoshiValidator.safeParse(0).success).toBe(true);
      expect(satoshiValidator.safeParse(Number.MAX_SAFE_INTEGER).success).toBe(true);
    });

    it('rejects negative amounts', () => {
      expect(satoshiValidator.safeParse(-100).success).toBe(false);
    });

    it('rejects non-integer values', () => {
      expect(satoshiValidator.safeParse(10.5).success).toBe(false);
    });

    it('rejects unsafe integers', () => {
      expect(satoshiValidator.safeParse(Number.MAX_SAFE_INTEGER + 1).success).toBe(false);
    });
  });

  describe('resourceIdValidator', () => {
    it('accepts valid resource IDs', () => {
      expect(resourceIdValidator.safeParse('txid:123').success).toBe(true);
      expect(resourceIdValidator.safeParse('channel-1').success).toBe(true);
    });

    it('rejects empty resource IDs', () => {
      expect(resourceIdValidator.safeParse('').success).toBe(false);
    });
  });

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

    it('passes through non-Zod errors', () => {
      const customError = new Error('Custom error');
      const badSchema = {
        parse: () => {
          throw customError;
        },
      } as unknown as z.ZodType<unknown>;

      expect(() => validateWithZod(badSchema, {})).toThrow(customError);
    });
  });
});
