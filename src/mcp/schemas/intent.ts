import { z } from 'zod';

/**
 * Intent schema for Lightning Network operations
 * Represents a user's intent to query channel information
 */
export const IntentSchema = z.object({
  // Type of channel operation to perform
  type: z.enum(['channel_list', 'channel_health', 'channel_liquidity', 'channel_unhealthy']),

  // Operation parameters
  parameters: z.object({
    // Optional channel ID to filter the operation to a specific channel
    channelId: z.string().optional(),

    // Optional limit for list operations
    limit: z.number().int().nonnegative().optional(),
  }),
});

/**
 * Type inference for channel operation intent
 */
export type Intent = z.infer<typeof IntentSchema>;
