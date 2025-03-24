import { ChannelQueryResult } from '../../domain/channels/entities/Channel';
import { ChannelService } from '../../domain/channels/services/ChannelService';
import { ChannelFormatter } from '../../domain/channels/formatters/ChannelFormatter';
import { Intent } from '../../domain/intents/entities/Intent';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';

/**
 * Response structure for channel queries
 */
export interface ChannelQueryResponse {
  type: string;
  response: string;
  data: ChannelQueryResult;
  error?: Error;
}

/**
 * Application service for handling channel queries
 */
export class ChannelQueryHandler {
  private formatter: ChannelFormatter;

  constructor(private readonly channelService: ChannelService) {
    this.formatter = new ChannelFormatter();
  }

  /**
   * Handle a channel query based on intent
   */
  async handleQuery(intent: Intent): Promise<ChannelQueryResponse> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const startTime = Date.now();

      logger.info('Processing channel query', {
        component: 'channel-handler',
        requestId: requestId,
        intentType: intent.type,
        query: intent.query,
      });

      // Get channel data from the service
      let channelData: ChannelQueryResult;

      // For unhealthy channels feature:
      if (intent.type === 'channel_unhealthy') {
        channelData = await this.channelService.getUnhealthyChannels();
      } else {
        channelData = await this.channelService.getChannelsWithHealth();
      }

      let result: ChannelQueryResponse;

      // Format response based on intent type
      switch (intent.type) {
        case 'channel_list':
          result = {
            type: 'channel_list',
            response: this.formatter.formatChannelList(channelData),
            data: channelData,
          };
          break;

        case 'channel_health':
          result = {
            type: 'channel_health',
            response: this.formatter.formatChannelHealth(channelData),
            data: channelData,
          };
          break;

        case 'channel_liquidity':
          result = {
            type: 'channel_liquidity',
            response: this.formatter.formatChannelLiquidity(channelData),
            data: channelData,
          };
          break;

        case 'channel_unhealthy':
          result = {
            type: 'channel_unhealthy',
            response: this.formatter.formatUnhealthyChannels(channelData),
            data: channelData,
          };
          break;

        default:
          result = {
            type: 'unknown',
            response:
              "I didn't understand that query. Try asking about your channel list, health, liquidity, or unhealthy channels.",
            data: channelData,
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
      const sanitizedError = sanitizeError(error);
      logger.error('Channel query failed', {
        component: 'channel-handler',
        requestId: requestId,
        intentType: intent.type,
        query: intent.query,
        error: sanitizedError.message,
      });

      return {
        type: 'error',
        response: `Error processing your query: ${sanitizedError.message}`,
        data: {
          channels: [],
          summary: {
            totalCapacity: 0,
            totalLocalBalance: 0,
            totalRemoteBalance: 0,
            activeChannels: 0,
            inactiveChannels: 0,
            healthyChannels: 0,
            unhealthyChannels: 0,
            averageCapacity: 0,
          },
        },
        error: sanitizedError,
      };
    }
  }
}
