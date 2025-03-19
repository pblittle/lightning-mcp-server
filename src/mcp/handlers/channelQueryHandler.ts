import * as lnService from 'ln-service';
import { LndClient } from '../../lnd/client';
import { Intent } from '../../types/intent';
import { Channel, ChannelQueryResult, ChannelSummary, HealthCriteria } from '../../types/channel';
import { ChannelFormatter } from '../formatters/channelFormatter';
import logger from '../../utils/logger';
import { sanitizeError } from '../../utils/sanitize';

export interface QueryResult {
  response: string;
  data: Record<string, any>;
  type?: string;
  text?: string;
  error?: Error;
}

export class ChannelQueryHandler {
  private formatter: ChannelFormatter;
  private readonly healthCriteria: HealthCriteria;

  /**
   * Creates a new ChannelQueryHandler
   *
   * @param lndClient - LND client for interacting with the Lightning Network
   * @param healthCriteria - Optional criteria for determining channel health
   */
  constructor(private readonly lndClient: LndClient, healthCriteria?: HealthCriteria) {
    this.formatter = new ChannelFormatter();
    this.healthCriteria = healthCriteria || {
      minLocalRatio: 0.1, // Default: 10% minimum local balance
      maxLocalRatio: 0.9, // Default: 90% maximum local balance
    };
  }

  async handleQuery(intent: Intent): Promise<QueryResult> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const startTime = Date.now();

      logger.info('Processing channel query', {
        component: 'channel-handler',
        requestId: requestId,
        intentType: intent.type,
        query: intent.query,
      });

      // Get channel data (common for all query types)
      logger.debug('Fetching channel data from LND', {
        component: 'channel-handler',
        requestId: requestId,
      });

      const channelData = await this.getChannelData();

      let result: QueryResult;

      // Format response based on intent type
      switch (intent.type) {
        case 'channel_list':
          result = {
            type: 'channel_list',
            text: this.formatter.formatChannelList(channelData),
            response: this.formatter.formatChannelList(channelData),
            data: channelData,
          };
          break;

        case 'channel_health':
          result = {
            type: 'channel_health',
            text: this.formatter.formatChannelHealth(channelData),
            response: this.formatter.formatChannelHealth(channelData),
            data: channelData,
          };
          break;

        case 'channel_liquidity':
          result = {
            type: 'channel_liquidity',
            text: this.formatter.formatChannelLiquidity(channelData),
            response: this.formatter.formatChannelLiquidity(channelData),
            data: channelData,
          };
          break;

        default:
          result = {
            type: 'unknown',
            text: "I didn't understand that query. Try asking about your channel list, health, or liquidity.",
            response:
              "I didn't understand that query. Try asking about your channel list, health, or liquidity.",
            data: {},
          };
      }

      const duration = Date.now() - startTime;
      logger.info('Channel query completed', {
        component: 'channel-handler',
        requestId: requestId,
        intentType: intent.type,
        durationMs: duration,
        channelCount: channelData.channels.length,
      });

      return result;
    } catch (error) {
      logger.error('Channel query failed', {
        component: 'channel-handler',
        requestId: requestId,
        intentType: intent.type,
        query: intent.query,
      });

      return {
        type: 'error',
        text: `Error processing your query: ${
          error instanceof Error ? error.message : String(error)
        }`,
        response: `Error processing your query: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error: error instanceof Error ? error : new Error(String(error)),
        data: {},
      };
    }
  }

  private async getChannelData(): Promise<ChannelQueryResult> {
    try {
      // Get channels from LND
      const lnd = this.lndClient.getLnd();
      const { channels } = await lnService.getChannels({ lnd });

      if (!channels || !Array.isArray(channels)) {
        return {
          channels: [],
          summary: this.calculateChannelSummary([]),
        };
      }

      // Get node aliases for each channel
      const channelsWithAliases = await this.addNodeAliases(channels);

      // Calculate summary statistics
      const summary = this.calculateChannelSummary(channelsWithAliases);

      return {
        channels: channelsWithAliases,
        summary,
      };
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error(`Error fetching channel data: ${sanitizedError.message}`);
      throw sanitizedError;
    }
  }

  /**
   * Adds node aliases to channels by fetching node information
   *
   * This method optimizes API calls by:
   * 1. Identifying unique node public keys across all channels
   * 2. Making a single API call per unique public key
   * 3. Mapping the results back to all channels
   *
   * @param channels - The channels to add aliases to
   * @returns Channels with remote_alias property added
   */
  private async addNodeAliases(channels: Channel[]): Promise<Channel[]> {
    const startTime = Date.now();
    const requestId = `alias-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const lnd = this.lndClient.getLnd();

      logger.debug('Starting node alias retrieval', {
        component: 'channel-handler',
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
        component: 'channel-handler',
        requestId,
        uniqueNodeCount: pubkeyMap.size,
        totalChannels: channels.length,
      });

      // Fetch all unique node infos in parallel
      const pubkeys = Array.from(pubkeyMap.keys());
      const nodeInfoPromises = pubkeys.map(async (pubkey) => {
        try {
          const nodeInfo = await lnService.getNodeInfo({ lnd, public_key: pubkey });
          return { pubkey, alias: nodeInfo?.alias || 'Unknown' };
        } catch (error) {
          logger.debug(`Could not fetch alias for node ${pubkey.substring(0, 8)}...`, {
            component: 'channel-handler',
            requestId,
            error: sanitizeError(error).message,
          });
          return { pubkey, alias: 'Unknown' };
        }
      });

      const nodeInfos = await Promise.all(nodeInfoPromises);

      // Update the map with aliases
      nodeInfos.forEach((info) => {
        pubkeyMap.set(info.pubkey, info.alias);
      });

      // Add aliases to channels
      const result = channels.map((channel) => ({
        ...channel,
        remote_alias: pubkeyMap.get(channel.remote_pubkey) || 'Unknown',
      }));

      const duration = Date.now() - startTime;
      logger.info('Node alias retrieval completed', {
        component: 'channel-handler',
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
        component: 'channel-handler',
        requestId,
        durationMs: duration,
        error: sanitizedError.message,
      });

      // Return original channels if we can't add aliases
      return channels;
    }
  }

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

    // Find most imbalanced channel
    let mostImbalancedChannel: Channel | undefined;
    let highestImbalanceRatio = 0;

    channels.forEach((channel) => {
      if (channel.capacity > 0) {
        const localRatio = channel.local_balance / channel.capacity;
        const imbalanceRatio = Math.abs(0.5 - localRatio);

        if (imbalanceRatio > highestImbalanceRatio) {
          highestImbalanceRatio = imbalanceRatio;
          mostImbalancedChannel = channel;
        }
      }
    });

    // Count healthy vs unhealthy channels
    // A channel is considered unhealthy if it's inactive or has extreme imbalance
    const unhealthyChannels = channels.filter((channel) => {
      if (!channel.active) return true;

      const localRatio = channel.local_balance / channel.capacity;
      return (
        localRatio < this.healthCriteria.minLocalRatio ||
        localRatio > this.healthCriteria.maxLocalRatio
      );
    }).length;

    // Log health criteria used for this calculation
    logger.debug('Channel health calculation', {
      component: 'channel-handler',
      healthCriteria: this.healthCriteria,
      totalChannels: channels.length,
      unhealthyChannels,
    });

    return {
      totalCapacity,
      totalLocalBalance,
      totalRemoteBalance,
      activeChannels: activeChannels.length,
      inactiveChannels: inactiveChannels.length,
      averageCapacity: totalCapacity / channels.length,
      mostImbalancedChannel,
      healthyChannels: channels.length - unhealthyChannels,
      unhealthyChannels,
    };
  }
}
