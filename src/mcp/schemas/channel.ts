/**
 * Zod schema for Lightning Network channels.
 *
 * This file defines the validation schema for Lightning Network payment
 * channels, ensuring consistent data structure and type safety throughout
 * the application. It uses specialized validators for Bitcoin-specific
 * data formats.
 */

import { z } from 'zod';
import { pubkeyValidator, satoshiValidator } from '../../utils/zod-validators';

/**
 * Lightning Network channel schema.
 *
 * Represents a payment channel between two Lightning Network nodes.
 * Aligned with the LnServiceChannel interface from ln-service
 * with additional fields specific to our application.
 */
export const ChannelSchema = z.object({
  // Total capacity of the channel in satoshis
  capacity: satoshiValidator.describe('Total capacity of the channel in satoshis'),

  // Local balance (your side) of the channel in satoshis
  local_balance: satoshiValidator.describe('Local balance of the channel in satoshis'),

  // Remote balance (their side) of the channel in satoshis
  remote_balance: satoshiValidator.describe('Remote balance of the channel in satoshis'),

  // Whether the channel is currently active and available for routing
  active: z.boolean().describe('Whether the channel is currently active'),

  // The public key of the remote node
  remote_pubkey: pubkeyValidator.describe('Public key of the remote node'),

  // Optional alias for the remote node
  remote_alias: z
    .string()
    .min(1, 'Remote alias cannot be empty')
    .optional()
    .describe('Human-readable alias for the remote node'),

  // Channel point (outpoint) in the format txid:output_index
  channel_point: z
    .string()
    .min(1, 'Channel point cannot be empty')
    .describe('Funding transaction outpoint (txid:output_index)'),
});

/**
 * Type inference for Lightning Network channel.
 */
export type Channel = z.infer<typeof ChannelSchema>;
