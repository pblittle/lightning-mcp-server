/**
 * @fileoverview Zod schemas for channel response structures.
 *
 * This file defines the schemas for health criteria, channel summary,
 * channel query result, and channel query response. These schemas are used
 * for validating and inferring types related to channel query responses.
 */

import { z } from 'zod';
import { ChannelSchema } from './channel';

export const HealthCriteriaSchema = z.object({
  minLocalRatio: z.number(),
  maxLocalRatio: z.number(),
});

export const ChannelSummarySchema = z.object({
  totalCapacity: z.number(),
  totalLocalBalance: z.number(),
  totalRemoteBalance: z.number(),
  activeChannels: z.number(),
  inactiveChannels: z.number(),
  averageCapacity: z.number(),
  healthyChannels: z.number(),
  unhealthyChannels: z.number(),
});

export const ChannelQueryResultSchema = z.object({
  channels: z.array(ChannelSchema),
  summary: ChannelSummarySchema,
});

export const ChannelQueryResponseSchema = z.object({
  type: z.string(),
  response: z.string(),
  data: ChannelQueryResultSchema,
  error: z.any().optional(),
});
