import * as lnService from 'ln-service';
import { LndClient } from '../../lnd/client';
import { Intent } from '../../types/intent';
import { Channel, ChannelQueryResult, ChannelSummary } from '../../types/channel';
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

  constructor(private readonly lndClient: LndClient) {
    this.formatter = new ChannelFormatter();
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

  private async addNodeAliases(channels: Channel[]): Promise<Channel[]> {
    try {
      const lnd = this.lndClient.getLnd();
      const channelsWithAliases = await Promise.all(
        channels.map(async (channel) => {
          try {
            // Get node info to get alias
            const nodeInfo = await lnService.getNodeInfo({
              lnd,
              public_key: channel.remote_pubkey,
            });

            return {
              ...channel,
              remote_alias: nodeInfo?.alias || 'Unknown',
            };
          } catch (error) {
            // If we can't get the alias, just return the channel without it
            return channel;
          }
        })
      );

      return channelsWithAliases;
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error(`Error adding node aliases: ${sanitizedError.message}`);
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
      return localRatio < 0.1 || localRatio > 0.9; // Extreme imbalance
    }).length;

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
