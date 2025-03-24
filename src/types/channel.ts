/**
 * Type definitions for Lightning Network channels and related data structures.
 *
 * This file contains TypeScript types derived from Zod schemas to ensure
 * consistency between runtime validation and compile-time type checking.
 * All types are aligned with their corresponding schema definitions.
 */

import { z } from 'zod';
import { ChannelSchema } from '../mcp/schemas/channel';
import {
  ChannelSummarySchema,
  ChannelQueryResultSchema,
  ChannelQueryResponseSchema,
  HealthCriteriaSchema,
} from '../schemas/channel-response';

/**
 * Health criteria for channels.
 *
 * Defines thresholds for determining channel health based on local/remote
 * balance ratios to identify channels that need rebalancing.
 */
export type HealthCriteria = z.infer<typeof HealthCriteriaSchema>;

/**
 * Lightning Network Channel.
 *
 * Represents a payment channel between two Lightning Network nodes.
 * Contains capacity, balance, and status information.
 */
export type Channel = z.infer<typeof ChannelSchema>;

/**
 * Channel Summary Statistics.
 *
 * Aggregated metrics about a node's channel portfolio including
 * total capacity, balance distribution, and health status counts.
 */
export type ChannelSummary = z.infer<typeof ChannelSummarySchema>;

/**
 * Channel Query Result.
 *
 * Complete result of a channel query containing both individual
 * channel details and summary statistics.
 */
export type ChannelQueryResult = z.infer<typeof ChannelQueryResultSchema>;

/**
 * Channel Query Response.
 *
 * MCP response format for channel queries, combining human-readable
 * text and structured data for display and programmatic use.
 */
export type ChannelQueryResponse = z.infer<typeof ChannelQueryResponseSchema>;
