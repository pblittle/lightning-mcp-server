import { z } from 'zod';

/**
 * Lightning Network channel schema
 * Represents a payment channel between two Lightning Network nodes
 */
export const ChannelSchema = z.object({
  // Total capacity of the channel in satoshis
  capacity: z.number().int().positive(),

  // Local balance (your side) of the channel in satoshis
  local_balance: z.number().int().nonnegative(),

  // Remote balance (their side) of the channel in satoshis
  remote_balance: z.number().int().nonnegative(),

  // Whether the channel is currently active and available for routing
  active: z.boolean(),

  // The public key of the remote node
  remote_pubkey: z.string().min(1),
});

/**
 * Type inference for Lightning Network channel
 */
export type Channel = z.infer<typeof ChannelSchema>;
