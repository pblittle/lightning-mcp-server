/**
 * @fileoverview Zod schema definition for Lightning Network Channel.
 *
 * This file defines channel-related schemas that are used for both runtime
 * validation and compile-time type inference.
 */

import { z } from 'zod';

/**
 * Schema for raw channel data
 */
export const RawChannelSchema = z.object({
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

/**
 * Schema for channel parameters
 */
export const ChannelParamsSchema = z.object({
  capacity: z.number().positive(),
  localBalance: z.number().nonnegative(),
  remoteBalance: z.number().nonnegative(),
  active: z.boolean(),
  remotePubkey: z.string(),
  channelPoint: z.string(),
  remoteAlias: z.string().optional(),
});

/**
 * Schema for channel entity (for backwards compatibility)
 */
export const ChannelSchema = RawChannelSchema;

/**
 * Type for raw channel data
 */
export type RawChannel = z.infer<typeof RawChannelSchema>;

/**
 * Type for channel parameters
 */
export type ChannelParams = z.infer<typeof ChannelParamsSchema>;

/**
 * Type for channel entity
 */
export type Channel = z.infer<typeof ChannelSchema>;
