/**
 * @fileoverview Intent domain entities defined using Zod schemas.
 *
 * This file exports type definitions derived from Zod schemas to ensure
 * runtime validation and compile-time type checking are in sync.
 */

import { z } from 'zod';
import { IntentSchema, IntentTypeSchema, QueryResultSchema } from '../schemas/intent';

/**
 * Types of channel queries supported
 */
export type IntentType = z.infer<typeof IntentTypeSchema>;

/**
 * Query intent with parameters
 */
export type Intent = z.infer<typeof IntentSchema>;

/**
 * Query result with natural language response and data
 */
export type QueryResult = z.infer<typeof QueryResultSchema>;
