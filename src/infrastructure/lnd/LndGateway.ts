/**
 * @fileoverview LND implementation of the Lightning Network Gateway.
 *
 * This module provides a concrete implementation of the LightningNetworkGateway interface
 * for interacting with Lightning Network data through an LND node. It uses the
 * LightningNodeConnection abstraction to allow for different connection types.
 */

import * as lnService from 'ln-service';
import { LightningNetworkGateway } from '../../domain/lightning/gateways/LightningNetworkGateway';
import { ChannelData } from '../../domain/channels/entities/Channel';
import { NodeInfo } from '../../domain/node/NodeInfo';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import { ConnectionError } from '../../domain/errors/ConnectionErrors';

/**
 * LND implementation of the Lightning Network Gateway
 */
export class LndGateway implements LightningNetworkGateway {
  private connection: LightningNodeConnection;

  /**
   * Creates a new LND gateway
   * @param connection Lightning Network node connection
   */
  constructor(connection: LightningNodeConnection) {
    this.connection = connection;
  }

  /**
   * Get the connection used by this gateway
   * @returns Lightning Network node connection
   */
  getConnection(): LightningNodeConnection {
    return this.connection;
  }

  /**
   * Fetch channels from LND node
   * @returns Promise resolving to an array of channels
   * @throws Error if channels cannot be fetched
   */
  async getChannels(): Promise<ChannelData[]> {
    try {
      // Get the connection and cast to ln-service type
      const lndConnection = this.getLndConnection();

      // Fetch channels from LND
      const { channels } = await lnService.getChannels({ lnd: lndConnection });

      if (!channels || !Array.isArray(channels)) {
        logger.warn('No channels returned from LND', {
          component: 'lnd-gateway',
          operation: 'getChannels',
        });
        return [];
      }

      // Map LND channels to domain model
      return channels.map((channel) => ({
        capacity: channel.capacity,
        local_balance: channel.local_balance,
        remote_balance: channel.remote_balance,
        active: channel.active,
        remote_pubkey: channel.remote_pubkey,
        channel_point: channel.channel_point,
      }));
    } catch (error) {
      const sanitizedError = sanitizeError(error) || new Error('Unknown error');
      logger.error('Error fetching channels', sanitizedError, {
        component: 'lnd-gateway',
        operation: 'getChannels',
      });
      throw new ConnectionError(`Failed to fetch channels: ${sanitizedError.message}`);
    }
  }

  /**
   * Get node information from LND
   * @param pubkey Public key of the node
   * @returns Promise resolving to node information or undefined if not found
   * @throws Error if node info cannot be fetched
   */
  async getNodeInfo(pubkey: string): Promise<NodeInfo | undefined> {
    try {
      // Get the connection and cast to ln-service type
      const lndConnection = this.getLndConnection();

      // Fetch node info from LND
      const nodeInfo = await lnService.getNodeInfo({
        lnd: lndConnection,
        public_key: pubkey,
      });

      if (!nodeInfo) {
        return undefined;
      }

      // Map to domain NodeInfo model
      return {
        alias: nodeInfo.alias || 'Unknown',
        pubkey: pubkey,
        color: nodeInfo.color || '#000000',
        activeChannelsCount: nodeInfo.channel_count || 0,
        pendingChannelsCount: 0, // Not available in getNodeInfo response
        peersCount: 0, // Not available in getNodeInfo response
      };
    } catch (error) {
      const sanitizedError = sanitizeError(error) || new Error('Unknown error');
      logger.error(`Error fetching node info for ${pubkey}`, sanitizedError, {
        component: 'lnd-gateway',
        operation: 'getNodeInfo',
        pubkey: pubkey,
      });
      throw new ConnectionError(`Failed to fetch node info: ${sanitizedError.message}`);
    }
  }

  /**
   * Get node alias from LND
   * @param pubkey Public key of the node
   * @returns Promise resolving to node alias or undefined if not found
   * @throws Error if node info cannot be fetched
   */
  async getNodeAlias(pubkey: string): Promise<string | undefined> {
    try {
      // Get the connection and cast to ln-service type
      const lndConnection = this.getLndConnection();

      // Fetch node info from LND
      const nodeInfo = await lnService.getNodeInfo({
        lnd: lndConnection,
        public_key: pubkey,
      });

      return nodeInfo.alias;
    } catch (error) {
      const sanitizedError = sanitizeError(error) || new Error('Unknown error');
      logger.error(`Error fetching node alias for ${pubkey}`, sanitizedError, {
        component: 'lnd-gateway',
        operation: 'getNodeAlias',
        pubkey: pubkey,
      });
      throw new ConnectionError(`Failed to fetch node alias: ${sanitizedError.message}`);
    }
  }

  /**
   * Get the LND connection from the generic connection
   * @returns LND connection from ln-service
   * @throws Error if the connection is not a valid LND connection
   * @private
   */
  private getLndConnection(): lnService.AuthenticatedLnd {
    // Get the raw connection
    const rawConnection = this.connection.getConnection();

    // Check if it's a valid LND connection
    if (!rawConnection || typeof rawConnection !== 'object') {
      throw new ConnectionError('Invalid LND connection');
    }

    return rawConnection as lnService.AuthenticatedLnd;
  }
}
