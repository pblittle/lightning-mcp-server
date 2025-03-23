import { z } from 'zod';
import { ChannelSchema } from '../mcp/schemas/channel';
import { satoshiValidator } from '../utils/zod-validators';

/**
 * Schema for channel health criteria.
 *
 * Lightning channels need balanced liquidity to function effectively.
 * This schema defines the acceptable range of local/remote balance ratios
 * to identify unhealthy channels that require rebalancing or other actions.
 */
export const HealthCriteriaSchema = z
  .object({
    // Minimum acceptable local balance ratio (0.0 to 1.0)
    minLocalRatio: z
      .number()
      .min(0, 'Minimum ratio cannot be negative')
      .max(1, 'Minimum ratio cannot exceed 1.0'),

    // Maximum acceptable local balance ratio (0.0 to 1.0)
    maxLocalRatio: z
      .number()
      .min(0, 'Maximum ratio cannot be negative')
      .max(1, 'Maximum ratio cannot exceed 1.0'),
  })
  .refine((data) => data.minLocalRatio <= data.maxLocalRatio, {
    message: 'Minimum ratio must be less than or equal to maximum ratio',
    path: ['minLocalRatio'],
  });

/**
 * Schema for aggregated channel metrics.
 *
 * This schema captures high-level statistics across all Lightning channels,
 * providing an overview of node liquidity distribution, channel health,
 * and overall capacity commitments for monitoring and reporting purposes.
 */
export const ChannelSummarySchema = z.object({
  // Total capacity across all channels in satoshis
  totalCapacity: satoshiValidator,

  // Total local balance across all channels in satoshis
  totalLocalBalance: satoshiValidator,

  // Total remote balance across all channels in satoshis
  totalRemoteBalance: satoshiValidator,

  // Number of channels that are currently active
  activeChannels: z.number().int().nonnegative(),

  // Number of channels that are currently inactive
  inactiveChannels: z.number().int().nonnegative(),

  // Average capacity per channel in satoshis
  averageCapacity: satoshiValidator,

  // Optional most imbalanced channel details
  mostImbalancedChannel: ChannelSchema.optional(),

  // Number of channels considered healthy based on criteria
  healthyChannels: z.number().int().nonnegative(),

  // Number of channels considered unhealthy based on criteria
  unhealthyChannels: z.number().int().nonnegative(),
});

/**
 * Schema for structured channel query results.
 *
 * Combines a collection of individual channel data with aggregated metrics
 * to provide both detailed and summary views of the Lightning Network state.
 * This structure enables both high-level monitoring and detailed channel inspection.
 */
export const ChannelQueryResultSchema = z.object({
  // Array of channel objects matching the query
  channels: z.array(ChannelSchema),

  // Summary statistics for the query results
  summary: ChannelSummarySchema,
});

/**
 * Schema for complete MCP tool responses to channel queries.
 *
 * Structures the full response format required by the MCP protocol,
 * combining human-readable text with machine-readable structured data
 * to support both UI presentation and programmatic processing.
 */
export const ChannelQueryResponseSchema = z.object({
  // Human-readable response message
  response: z.string(),

  // Structured data with query results
  data: ChannelQueryResultSchema,
});

// Type inferences from schemas
export type HealthCriteria = z.infer<typeof HealthCriteriaSchema>;
export type ChannelSummary = z.infer<typeof ChannelSummarySchema>;
export type ChannelQueryResult = z.infer<typeof ChannelQueryResultSchema>;
export type ChannelQueryResponse = z.infer<typeof ChannelQueryResponseSchema>;
