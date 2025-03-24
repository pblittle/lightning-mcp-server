import * as lnService from 'ln-service';
import { Channel } from '../../domain/channels/entities/Channel';
import { ChannelRepository } from '../../domain/channels/repositories/ChannelRepository';
import { LndClient } from './LndClient';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';

/**
 * LND implementation of the Channel Repository
 */
export class LndChannelRepository implements ChannelRepository {
  constructor(private readonly lndClient: LndClient) {}

  /**
   * Fetch channels from LND node
   */
  async getChannels(): Promise<Channel[]> {
    try {
      const lnd = this.lndClient.getLnd();
      const { channels } = await lnService.getChannels({ lnd });

      if (!channels || !Array.isArray(channels)) {
        return [];
      }

      return channels.map((channel) => ({
        capacity: channel.capacity,
        local_balance: channel.local_balance,
        remote_balance: channel.remote_balance,
        active: channel.active,
        remote_pubkey: channel.remote_pubkey,
        channel_point: channel.channel_point,
      }));
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Error fetching channels', {
        component: 'lnd-channel-repository',
        error: sanitizedError.message,
      });
      throw new Error(`Failed to fetch channels: ${sanitizedError.message}`);
    }
  }

  /**
   * Get node alias from LND
   */
  async getNodeAlias(pubkey: string): Promise<string | undefined> {
    try {
      const lnd = this.lndClient.getLnd();
      const nodeInfo = await lnService.getNodeInfo({ lnd, public_key: pubkey });
      return nodeInfo.alias;
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error(`Error fetching node info for ${pubkey}`, {
        component: 'lnd-channel-repository',
        pubkey: pubkey,
        error: sanitizedError.message,
      });
      throw new Error(`Failed to fetch node info: ${sanitizedError.message}`);
    }
  }
}
