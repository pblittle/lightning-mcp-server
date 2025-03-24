/**
 * @fileoverview Zod schema definitions for Intent domain.
 *
 * This file defines schemas for intent types, intent objects, and query results.
 * These schemas provide runtime validation and type inference for the Intent domain.
 */

import { z } from 'zod';

/**
 * Schema for supported intent types
 */
export const IntentTypeSchema = z.enum([
  'channel_list',
  'channel_health',
  'channel_liquidity',
  'channel_unhealthy',
  'unknown',
]);

/**
 * Schema for intent object
 */
export const IntentSchema = z.object({
  type: IntentTypeSchema,
  query: z.string(),
  error: z.instanceof(Error).optional(),
});

/**
 * Schema for query result
 */
export const QueryResultSchema = z.object({
  data: z.record(z.string(), z.any()),
  type: z.string().optional(),
  response: z.string().optional(),
});
