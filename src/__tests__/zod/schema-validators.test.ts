import { z } from 'zod';
import {
  pubkeyValidator,
  satoshiValidator,
  resourceIdValidator,
  validateWithZod,
} from '../../utils/zod-validators';

describe('Zod Validators', () => {
  describe('pubkeyValidator', () => {
    it('should validate correct pubkeys', () => {
      const validPubkey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
      expect(() => pubkeyValidator.parse(validPubkey)).not.toThrow();
    });

    it('should reject empty pubkeys', () => {
      expect(() => pubkeyValidator.parse('')).toThrow();
    });

    it('should handle longer identifiers for development', () => {
      // For development, we allow longer identifiers that might not be strict pubkeys
      const developmentId = '1234567890abcdef1234567890abcdef';
      expect(() => pubkeyValidator.parse(developmentId)).not.toThrow();
    });
  });

  describe('satoshiValidator', () => {
    it('should validate correct satoshi amounts', () => {
      expect(() => satoshiValidator.parse(1000)).not.toThrow();
      expect(() => satoshiValidator.parse(0)).not.toThrow();
    });

    it('should reject negative amounts', () => {
      expect(() => satoshiValidator.parse(-100)).toThrow();
    });

    it('should reject floating point values', () => {
      expect(() => satoshiValidator.parse(100.5)).toThrow();
    });
  });

  describe('resourceIdValidator', () => {
    it('should validate non-empty strings', () => {
      expect(() => resourceIdValidator.parse('channel123')).not.toThrow();
    });

    it('should reject empty strings', () => {
      expect(() => resourceIdValidator.parse('')).toThrow();
    });
  });

  describe('validateWithZod', () => {
    const testSchema = z.object({
      id: z.string(),
      value: z.number().positive(),
    });

    it('should return validated data for valid input', () => {
      const validData = { id: 'test', value: 42 };
      const result = validateWithZod(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw formatted error for invalid input', () => {
      const invalidData = { id: '', value: -1 };
      expect(() => validateWithZod(testSchema, invalidData)).toThrow('Validation error');
    });
  });
});
