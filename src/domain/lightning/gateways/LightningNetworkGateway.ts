/**
 * @fileoverview Lightning Network Gateway interface.
 *
 * Defines a standard interface for accessing Lightning Network data
 * regardless of the specific implementation (LND, LNC, etc).
 * Implements the Gateway pattern to provide a clean abstraction
 * over different connection mechanisms.
 */

import { ChannelData } from '../../channels/entities/Channel';
import { NodeInfo } from '../../node/NodeInfo';
import { LightningNodeConnection } from '../../node/LightningNodeConnection';

/**
 * Gateway interface for accessing Lightning Network data
 *
 * This interface abstracts the specifics of different Lightning Network
 * connection methods (LND direct, LNC) behind a consistent interface.
 * It provides access to channel data and node information.
 */
export interface LightningNetworkGateway {
  /**
   * Retrieve all channels from the Lightning Network node
   * @returns Promise resolving to array of channel data
   * @throws Error if retrieval fails
   */
  getChannels(): Promise<ChannelData[]>;

  /**
   * Retrieve information about a specific node by public key
   * @param pubkey The public key of the node
   * @returns Promise resolving to node information or undefined if not found
   * @throws Error if retrieval fails
   */
  getNodeInfo(pubkey: string): Promise<NodeInfo | undefined>;

  /**
   * Get the alias of a node by its public key
   * @param pubkey The public key of the node
   * @returns Promise resolving to node alias or undefined if not found
   * @throws Error if retrieval fails
   */
  getNodeAlias(pubkey: string): Promise<string | undefined>;

  /**
   * Get the underlying connection used by this gateway
   * @returns The connection object
   */
  getConnection(): LightningNodeConnection;
}
