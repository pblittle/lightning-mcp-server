/**
 * @fileoverview Zod schema definition for Lightning Network Channel.
 *
 * This file defines channel-related schemas that are used for both runtime
 * validation and compile-time type inference.
 */

import { z } from 'zod';

/**
 * Schema for raw channel data
 * @internal Used only within schemas
 */
const RawChannelSchema = z.object({
  capacity: z.number(),
  local_balance: z.number(),
  remote_balance: z.number(),
  active: z.boolean(),
  remote_pubkey: z.string(),
  channel_point: z.string(),
  remote_alias: z.string().optional(),
  _error: z
    .object({
      type: z.string(),
      message: z.string(),
    })
    .optional(),
});

// Channel parameters are defined directly in Channel.class.ts

/**
 * Schema for channel entity (for backwards compatibility)
 */
export const ChannelSchema = RawChannelSchema;

// Types are inferred directly where needed

/**
 * Type for channel data structure
 */
export type ChannelData = z.infer<typeof ChannelSchema>;
