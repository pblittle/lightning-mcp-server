/**
 * @fileoverview Service for channel-related business logic.
 *
 * This module implements the ChannelService which provides methods to fetch channels,
 * enrich channel metadata, compute health metrics, and filter unhealthy channels.
 * It uses Zod schemas for runtime validation to ensure consistency with the domain entities.
 */

import { Channel, ChannelQueryResult, ChannelSummary, HealthCriteria } from '../entities/Channel';
import { ChannelRepository } from '../repositories/ChannelRepository';
import { validateWithZod } from '../../../core/validation/zod-validators';
import { ChannelQueryResultSchema } from '../schemas/channel-response';
import { sanitizeError } from '../../../core/errors/sanitize';
import logger from '../../../core/logging/logger';

/**
 * Service for channel-related business logic
 */
export class ChannelService {
  private healthCriteria: HealthCriteria;

  constructor(
    private readonly channelRepository: ChannelRepository,
    healthCriteria?: HealthCriteria
  ) {
    // Default health criteria if none provided
    this.healthCriteria = healthCriteria || {
      minLocalRatio: 0.1, // 10% minimum local balance
      maxLocalRatio: 0.9, // 90% maximum local balance
    };
  }

  /**
   * Get all channels with computed health metrics
   */
  async getChannelsWithHealth(): Promise<ChannelQueryResult> {
    try {
      // Fetch raw channels
      const channels = await this.channelRepository.getChannels();

      // Enrich channels with aliases
      const enrichedChannels = await this.enrichChannelsWithMetadata(channels);

      // Calculate summary statistics
      const summary = this.calculateChannelSummary(enrichedChannels);

      const result = {
        channels: enrichedChannels,
        summary,
      };

      // Validate the result
      return validateWithZod(ChannelQueryResultSchema, result);
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error(`Error fetching channel data: ${sanitizedError.message}`);
      throw sanitizedError;
    }
  }

  /**
   * Get only unhealthy channels
   */
  async getUnhealthyChannels(): Promise<ChannelQueryResult> {
    const allChannelData = await this.getChannelsWithHealth();

    // Filter to include only unhealthy channels
    const unhealthyChannels = allChannelData.channels.filter((channel: Channel) => {
      if (!channel.active) return true;

      const localRatio = channel.local_balance / channel.capacity;
      return (
        localRatio < this.healthCriteria.minLocalRatio ||
        localRatio > this.healthCriteria.maxLocalRatio
      );
    });

    const result = {
      channels: unhealthyChannels,
      summary: allChannelData.summary,
    };

    return validateWithZod(ChannelQueryResultSchema, result);
  }

  /**
   * Enrich channels with additional metadata like node aliases
   */
  private async enrichChannelsWithMetadata(channels: Channel[]): Promise<Channel[]> {
    if (channels.length === 0) {
      return [];
    }

    return this.addNodeAliases(channels);
  }

  /**
   * Add node aliases to channels
   */
  private async addNodeAliases(channels: Channel[]): Promise<Channel[]> {
    const startTime = Date.now();
    const requestId = `alias-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      logger.debug('Starting node alias retrieval', {
        component: 'channel-service',
        requestId,
        channelCount: channels.length,
      });

      // Create a map of pubkeys to avoid duplicate lookups
      const pubkeyMap = new Map<string, string>();
      channels.forEach((channel) => {
        if (!pubkeyMap.has(channel.remote_pubkey)) {
          pubkeyMap.set(channel.remote_pubkey, '');
        }
      });

      logger.debug('Fetching node aliases', {
        component: 'channel-service',
        requestId,
        uniqueNodeCount: pubkeyMap.size,
        totalChannels: channels.length,
      });

      // Fetch all unique node aliases in parallel
      const pubkeys = Array.from(pubkeyMap.keys());
      const errorMap = new Map<string, { type: string; message: string }>();

      const nodeInfoPromises = pubkeys.map(async (pubkey) => {
        try {
          const alias = await this.channelRepository.getNodeAlias(pubkey);
          return { pubkey, alias: alias || 'Unknown' };
        } catch (error) {
          const sanitizedError = sanitizeError(error);
          logger.debug(`Could not fetch alias for node ${pubkey.substring(0, 8)}...`, {
            component: 'channel-service',
            requestId,
            error: sanitizedError.message,
          });
          // Track the error for this pubkey
          errorMap.set(pubkey, {
            type: 'alias_retrieval_failed',
            message: sanitizedError.message,
          });
          return { pubkey, alias: 'Unknown (Error retrieving)' };
        }
      });

      const nodeInfos = await Promise.all(nodeInfoPromises);

      // Update the map with aliases
      nodeInfos.forEach((info) => {
        pubkeyMap.set(info.pubkey, info.alias);
      });

      // Add aliases and error information to channels
      const result = channels.map((channel) => {
        const errorInfo = errorMap.get(channel.remote_pubkey);
        if (errorInfo) {
          return {
            ...channel,
            remote_alias: pubkeyMap.get(channel.remote_pubkey) || 'Unknown',
            _error: errorInfo,
          };
        } else {
          return {
            ...channel,
            remote_alias: pubkeyMap.get(channel.remote_pubkey) || 'Unknown',
          };
        }
      });

      const duration = Date.now() - startTime;
      logger.info('Node alias retrieval completed', {
        component: 'channel-service',
        requestId,
        durationMs: duration,
        uniqueNodeCount: pubkeyMap.size,
        totalChannels: channels.length,
      });

      return result;
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      const duration = Date.now() - startTime;

      logger.error(`Error adding node aliases: ${sanitizedError.message}`, {
        component: 'channel-service',
        requestId,
        durationMs: duration,
        error: sanitizedError.message,
      });

      // Mark channels with error information to indicate failure
      return channels.map((channel) => ({
        ...channel,
        remote_alias: 'Unknown (Error retrieving)',
        _error: {
          type: 'alias_retrieval_failed',
          message: sanitizedError.message,
        },
      }));
    }
  }

  /**
   * Calculate summary statistics for a set of channels
   */
  private calculateChannelSummary(channels: Channel[]): ChannelSummary {
    if (channels.length === 0) {
      return {
        totalCapacity: 0,
        totalLocalBalance: 0,
        totalRemoteBalance: 0,
        activeChannels: 0,
        inactiveChannels: 0,
        averageCapacity: 0,
        healthyChannels: 0,
        unhealthyChannels: 0,
      };
    }

    const activeChannels = channels.filter((c) => c.active);
    const inactiveChannels = channels.filter((c) => !c.active);

    const totalCapacity = channels.reduce((sum, channel) => sum + channel.capacity, 0);
    const totalLocalBalance = channels.reduce((sum, channel) => sum + channel.local_balance, 0);
    const totalRemoteBalance = channels.reduce((sum, channel) => sum + channel.remote_balance, 0);

    // Count unhealthy channels
    const unhealthyChannels = channels.filter((channel) => {
      if (!channel.active) return true;

      const localRatio = channel.local_balance / channel.capacity;
      return (
        localRatio < this.healthCriteria.minLocalRatio ||
        localRatio > this.healthCriteria.maxLocalRatio
      );
    }).length;

    return {
      totalCapacity,
      totalLocalBalance,
      totalRemoteBalance,
      activeChannels: activeChannels.length,
      inactiveChannels: inactiveChannels.length,
      averageCapacity: totalCapacity / channels.length,
      healthyChannels: channels.length - unhealthyChannels,
      unhealthyChannels,
    };
  }
}
