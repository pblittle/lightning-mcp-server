/**
 * @fileoverview LNC implementation of the Lightning Network Gateway.
 *
 * This module provides a concrete implementation of the LightningNetworkGateway interface
 * for interacting with Lightning Network data through Lightning Node Connect (LNC).
 * It uses the LightningNodeConnection abstraction to allow for different connection types.
 */

import { LightningNetworkGateway } from '../../domain/lightning/gateways/LightningNetworkGateway';
import { ChannelData } from '../../domain/channels/entities/Channel';
import { NodeInfo } from '../../domain/node/NodeInfo';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { LndApi } from '@lightninglabs/lnc-core';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import { ConnectionError } from '../../domain/errors/ConnectionErrors';

/**
 * LNC implementation of the Lightning Network Gateway
 */
export class LncGateway implements LightningNetworkGateway {
  private connection: LightningNodeConnection;

  /**
   * Creates a new LNC gateway
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
   * Fetch channels from LNC
   * @returns Promise resolving to an array of channels
   * @throws Error if channels cannot be fetched
   */
  async getChannels(): Promise<ChannelData[]> {
    try {
      // Get the connection and cast to LNC API
      const lncApi = this.getLncApi();

      // In a real implementation, we would use the LNC API to fetch channels
      // For now, we'll use a simulated implementation
      // Note: We're using any type here because the LndApi type doesn't fully
      // define all the methods available in the actual implementation
      const lncApiAny = lncApi as any;
      const listChannelsResponse = await lncApiAny.listChannels?.();

      if (
        !listChannelsResponse ||
        !listChannelsResponse.channels ||
        !Array.isArray(listChannelsResponse.channels)
      ) {
        logger.warn('No channels returned from LNC', {
          component: 'lnc-gateway',
          operation: 'getChannels',
        });
        return [];
      }

      // Map LNC channels to domain model
      return listChannelsResponse.channels.map((channel: any) => ({
        capacity: channel.capacity,
        local_balance: channel.local_balance,
        remote_balance: channel.remote_balance,
        active: channel.active,
        remote_pubkey: channel.remote_pubkey,
        channel_point: channel.channel_point,
      }));
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Error fetching channels via LNC', {
        component: 'lnc-gateway',
        operation: 'getChannels',
        error: sanitizedError.message,
      });
      throw new Error(`Failed to fetch channels via LNC: ${sanitizedError.message}`);
    }
  }

  /**
   * Get node information from LNC
   * @param pubkey Public key of the node
   * @returns Promise resolving to node information or undefined if not found
   * @throws Error if node info cannot be fetched
   */
  async getNodeInfo(pubkey: string): Promise<NodeInfo | undefined> {
    try {
      // Get the connection and cast to LNC API
      const lncApi = this.getLncApi();

      // In a real implementation, we would use the LNC API to fetch node info
      // For now, we'll use a simulated implementation
      // Note: We're using any type here because the LndApi type doesn't fully
      // define all the methods available in the actual implementation
      const lncApiAny = lncApi as any;
      const nodeInfo = await lncApiAny.getNodeInfo?.({ pub_key: pubkey });

      if (!nodeInfo || !nodeInfo.node) {
        return undefined;
      }

      // Map to domain NodeInfo model
      return {
        alias: nodeInfo.node.alias || 'Unknown',
        pubkey: pubkey,
        color: nodeInfo.node.color || '#000000',
        activeChannelsCount: nodeInfo.num_channels || 0,
        pendingChannelsCount: 0, // Not available in getNodeInfo response
        peersCount: 0, // Not available in getNodeInfo response
      };
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error(`Error fetching node info for ${pubkey} via LNC`, {
        component: 'lnc-gateway',
        operation: 'getNodeInfo',
        pubkey: pubkey,
        error: sanitizedError.message,
      });
      throw new Error(`Failed to fetch node info via LNC: ${sanitizedError.message}`);
    }
  }

  /**
   * Get node alias from LNC
   * @param pubkey Public key of the node
   * @returns Promise resolving to node alias or undefined if not found
   * @throws Error if node info cannot be fetched
   */
  async getNodeAlias(pubkey: string): Promise<string | undefined> {
    try {
      const nodeInfo = await this.getNodeInfo(pubkey);
      return nodeInfo?.alias;
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error(`Error fetching node alias for ${pubkey} via LNC`, {
        component: 'lnc-gateway',
        operation: 'getNodeAlias',
        pubkey: pubkey,
        error: sanitizedError.message,
      });
      throw new Error(`Failed to fetch node alias via LNC: ${sanitizedError.message}`);
    }
  }

  /**
   * Get the LNC API from the generic connection
   * @returns LNC API
   * @throws Error if the connection is not a valid LNC connection
   * @private
   */
  private getLncApi(): LndApi {
    // Get the raw connection
    const rawConnection = this.connection.getConnection();

    // Check if it's a valid LNC connection
    if (!rawConnection || typeof rawConnection !== 'object') {
      throw new ConnectionError('Invalid LNC connection');
    }

    return rawConnection as LndApi;
  }
}
