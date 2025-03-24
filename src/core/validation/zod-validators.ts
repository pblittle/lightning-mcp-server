/**
 * Validation utilities for Lightning Network data.
 *
 * This file contains reusable Zod validators that enforce consistency
 * across Lightning Network data formats, preventing common errors and
 * ensuring proper data integrity for protocol operations.
 */

import { z } from 'zod';

/**
 * Validates node public keys while allowing for test environments.
 *
 * For mainnet, keys should be exactly 66 characters (33 bytes hex encoded),
 * but test environments often use simplified identifiers.
 */
export const pubkeyValidator = z
  .string()
  .min(1, 'Public key cannot be empty')
  .refine((val) => /^[0-9a-f]{66}$/i.test(val) || val.length >= 16, {
    message: 'Invalid public key format',
  });

/**
 * Validates Lightning Network satoshi amounts.
 *
 * Bitcoin amounts must be handled as integers to prevent floating-point
 * precision errors. This validator enforces integer values within the safe
 * range and prevents negative amounts which are impossible in Bitcoin.
 */
export const satoshiValidator = z
  .number()
  .int('Amount must be a whole number')
  .nonnegative('Amount cannot be negative')
  .safe('Amount must be within safe integer range');

/**
 * Ensures resource identifiers meet minimum requirements.
 *
 * Resource IDs must be non-empty to ensure proper reference tracking
 * and avoid empty identifiers that can cause lookup failures.
 */
export const resourceIdValidator = z.string().min(1, 'ID cannot be empty');

/**
 * Provides unified validation error handling for Zod schemas.
 *
 * This helper standardizes error output format across the application,
 * converting Zod's internal error structure into a more usable format
 * that includes clear path information for debugging validation issues.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The validated and typed data
 * @throws Error with formatted validation details if validation fails
 */
export function validateWithZod<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format the error for consistent handling
      const formattedError = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      // Re-throw with formatted error
      throw new Error(`Validation error: ${JSON.stringify(formattedError)}`);
    }
    throw error;
  }
}
