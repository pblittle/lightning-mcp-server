/**
 * @fileoverview Channel domain handler.
 *
 * Handles intents related to Lightning Network channels.
 * This includes listing channels and analyzing liquidity.
 */

import { DomainHandler } from './DomainHandler';
import { EnhancedIntent, LightningOperation } from '../intents/entities/EnhancedIntent';
import { LightningNetworkGateway } from '../lightning/gateways/LightningNetworkGateway';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import { ChannelData } from '../channels/entities/Channel';

/**
 * Result of a channel query
 */
export interface ChannelQueryResult {
  channels: ChannelData[];
  summary: {
    totalCapacity: number;
    totalLocalBalance: number;
    totalRemoteBalance: number;
    activeChannels: number;
    inactiveChannels: number;
    averageCapacity?: number;
    healthyChannels?: number;
    unhealthyChannels?: number;
  };
  formattedResults?: {
    list?: string;
    liquidity?: string;
  };
}

/**
 * Handler for channel-related intents
 */
export class ChannelDomainHandler implements DomainHandler {
  /**
   * Create a new channel domain handler
   * @param gateway The Lightning Network gateway to use
   */
  constructor(private readonly gateway: LightningNetworkGateway) {}

  /**
   * Check if this handler can handle the given intent
   * @param intent The intent to check
   * @returns Whether this handler can handle the intent
   */
  canHandle(intent: EnhancedIntent): boolean {
    return intent.domain === 'channels';
  }

  /**
   * Handle a channel-related intent
   * @param intent The intent to handle
   * @returns Promise resolving to the result of handling the intent
   */
  async handle(intent: EnhancedIntent): Promise<ChannelQueryResult> {
    try {
      logger.debug(`Handling channel intent: ${intent.operation}`, {
        component: 'channel-domain-handler',
        operation: intent.operation,
      });

      // Get the channels from the gateway
      const channels = await this.gateway.getChannels();

      // Enrich channels with node aliases
      const enrichedChannels = await this.enrichChannelsWithMetadata(channels);

      // Calculate summary statistics
      const summary = this.calculateChannelSummary(enrichedChannels);

      // Create the base result
      const result: ChannelQueryResult = {
        channels: enrichedChannels,
        summary,
        formattedResults: {},
      };

      // Format the results based on the operation
      await this.formatResults(result, intent.operation);

      return result;
    } catch (error) {
      const sanitizedError = sanitizeError(error) || new Error('Unknown error');
      logger.error(`Error handling channel intent: ${intent.operation}`, sanitizedError, {
        component: 'channel-domain-handler',
        operation: intent.operation,
      });
      throw sanitizedError;
    }
  }

  /**
   * Enrich channels with additional metadata
   * @param channels The channels to enrich
   * @returns Promise resolving to enriched channels
   * @private
   */
  private async enrichChannelsWithMetadata(channels: ChannelData[]): Promise<ChannelData[]> {
    if (channels.length === 0) {
      return [];
    }

    try {
      // Create a map of pubkeys to avoid duplicate lookups
      const pubkeyMap = new Map<string, string>();
      channels.forEach((channel) => {
        if (!pubkeyMap.has(channel.remote_pubkey)) {
          pubkeyMap.set(channel.remote_pubkey, '');
        }
      });

      // Fetch all unique node aliases in parallel
      const pubkeys = Array.from(pubkeyMap.keys());
      const nodeInfoPromises = pubkeys.map(async (pubkey) => {
        try {
          const alias = await this.gateway.getNodeAlias(pubkey);
          return { pubkey, alias: alias || 'Unknown' };
        } catch (error) {
          logger.debug(`Could not fetch alias for node ${pubkey.substring(0, 8)}...`, {
            component: 'channel-domain-handler',
            error: sanitizeError(error)?.message || 'Unknown error',
          });
          return { pubkey, alias: 'Unknown (Error retrieving)' };
        }
      });

      const nodeInfos = await Promise.all(nodeInfoPromises);

      // Update the map with aliases
      nodeInfos.forEach((info) => {
        pubkeyMap.set(info.pubkey, info.alias);
      });

      // Add aliases to channels
      return channels.map((channel) => ({
        ...channel,
        remote_alias: pubkeyMap.get(channel.remote_pubkey) || 'Unknown',
      }));
    } catch (error) {
      logger.error('Error enriching channels with metadata', {
        component: 'channel-domain-handler',
        error: sanitizeError(error)?.message || 'Unknown error',
      });

      // Return the original channels if we can't enrich them
      return channels;
    }
  }

  /**
   * Calculate summary statistics for channels
   * @param channels The channels to calculate statistics for
   * @returns Summary statistics
   * @private
   */
  private calculateChannelSummary(channels: ChannelData[]): ChannelQueryResult['summary'] {
    if (channels.length === 0) {
      return {
        totalCapacity: 0,
        totalLocalBalance: 0,
        totalRemoteBalance: 0,
        activeChannels: 0,
        inactiveChannels: 0,
        averageCapacity: 0,
      };
    }

    const activeChannels = channels.filter((c) => c.active);
    const inactiveChannels = channels.filter((c) => !c.active);

    const totalCapacity = channels.reduce((sum, channel) => sum + channel.capacity, 0);
    const totalLocalBalance = channels.reduce((sum, channel) => sum + channel.local_balance, 0);
    const totalRemoteBalance = channels.reduce((sum, channel) => sum + channel.remote_balance, 0);

    return {
      totalCapacity,
      totalLocalBalance,
      totalRemoteBalance,
      activeChannels: activeChannels.length,
      inactiveChannels: inactiveChannels.length,
      averageCapacity: totalCapacity / channels.length,
    };
  }

  /**
   * Format results based on the operation
   * @param result The result to format
   * @param operation The operation that was performed
   * @private
   */
  private async formatResults(
    result: ChannelQueryResult,
    operation: LightningOperation
  ): Promise<void> {
    // Format the results based on the operation
    switch (operation) {
      case 'list': {
        // Create a base list format that will be used for all channel queries
        let listText = this.formatChannelList(result);

        // Check if there are any special formatting needs based on attributes
        const inactiveChannels = result.channels.filter((c) => !c.active);

        // If there are inactive channels, enhance the output with health information
        if (inactiveChannels.length > 0) {
          listText += `\n\nInactive channels (${inactiveChannels.length}):\n`;
          inactiveChannels.forEach((channel, index) => {
            listText += `${index + 1}. ${channel.remote_alias}: ${this.formatSats(
              channel.capacity
            )}\n`;
          });
        }

        result.formattedResults = {
          ...result.formattedResults,
          list: listText,
        };
        break;
      }

      case 'liquidity': {
        result.formattedResults = {
          ...result.formattedResults,
          liquidity: this.formatChannelLiquidity(result),
        };
        break;
      }

      default: {
        // For unknown operations, format as a generic list
        result.formattedResults = {
          ...result.formattedResults,
          list: this.formatChannelList(result),
        };
        break;
      }
    }
  }

  /**
   * Format channel list as text
   * @param result The channel query result
   * @returns Formatted channel list
   * @private
   */
  private formatChannelList(result: ChannelQueryResult): string {
    const { channels, summary } = result;

    if (channels.length === 0) {
      return 'No channels found.';
    }

    // Sort channels by capacity (descending)
    const sortedChannels = [...channels].sort((a, b) => b.capacity - a.capacity);

    // Format the summary
    let output = `Your node has ${
      channels.length
    } channels with a total capacity of ${this.formatSats(summary.totalCapacity)}. ${
      summary.activeChannels
    } channels are active and ${summary.inactiveChannels} are inactive.\n\n`;

    // Format the channel list
    output += 'Your channels:\n';
    sortedChannels.forEach((channel, index) => {
      output += `${index + 1}. ${channel.remote_alias}: ${this.formatSats(channel.capacity)} (${
        channel.active ? 'active' : 'inactive'
      })\n`;
    });

    return output;
  }

  /**
   * Format channel liquidity as text
   * @param result The channel query result
   * @returns Formatted channel liquidity
   * @private
   */
  private formatChannelLiquidity(result: ChannelQueryResult): string {
    const { channels, summary } = result;

    if (channels.length === 0) {
      return 'No channels found.';
    }

    // Calculate local and remote percentages
    const localPercentage = (summary.totalLocalBalance / summary.totalCapacity) * 100;
    const remotePercentage = (summary.totalRemoteBalance / summary.totalCapacity) * 100;

    // Format the summary
    let output = `Liquidity Distribution: ${this.formatSats(
      summary.totalLocalBalance
    )} local (${localPercentage.toFixed(0)}%), ${this.formatSats(
      summary.totalRemoteBalance
    )} remote (${remotePercentage.toFixed(0)}%).\n\n`;

    // Calculate balance ratios for each channel
    const channelsWithRatios = channels.map((channel) => ({
      ...channel,
      localRatio: channel.local_balance / channel.capacity,
    }));

    // Sort by balance ratio (most balanced first)
    const mostBalanced = [...channelsWithRatios]
      .filter((c) => c.active)
      .sort((a, b) => Math.abs(0.5 - a.localRatio) - Math.abs(0.5 - b.localRatio))
      .slice(0, 3);

    // Sort by balance ratio (most imbalanced first)
    const mostImbalanced = [...channelsWithRatios]
      .filter((c) => c.active)
      .sort((a, b) => Math.abs(0.5 - b.localRatio) - Math.abs(0.5 - a.localRatio))
      .slice(0, 3);

    // Format the most balanced channels
    if (mostBalanced.length > 0) {
      output += 'Your most balanced channels:\n';
      mostBalanced.forEach((channel, index) => {
        const localPercentage = (channel.localRatio * 100).toFixed(0);
        const remotePercentage = (100 - channel.localRatio * 100).toFixed(0);
        output += `${index + 1}. ${
          channel.remote_alias
        }: ${localPercentage}% local / ${remotePercentage}% remote\n`;
      });
      output += '\n';
    }

    // Format the most imbalanced channels
    if (mostImbalanced.length > 0) {
      output += 'Your most imbalanced channels:\n';
      mostImbalanced.forEach((channel, index) => {
        const localPercentage = (channel.localRatio * 100).toFixed(0);
        const remotePercentage = (100 - channel.localRatio * 100).toFixed(0);
        output += `${index + 1}. ${
          channel.remote_alias
        }: ${localPercentage}% local / ${remotePercentage}% remote\n`;
      });
    }

    return output;
  }

  /**
   * Format satoshis as a string
   * @param sats The satoshis to format
   * @returns Formatted satoshis
   * @private
   */
  private formatSats(sats: number): string {
    const btc = sats / 100000000;
    return `${btc.toFixed(8)} BTC (${sats.toLocaleString()} sats)`;
  }
}
