/**
 * @fileoverview Base adapter for Lightning Node connections.
 *
 * Provides a base implementation for the adapter pattern used to connect
 * to different Lightning Network node implementations.
 */

import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { NodeInfo } from '../../domain/node/NodeInfo';
import { ConnectionDetails } from '../../domain/node/ConnectionAuth';
import logger from '../../core/logging/logger';

/**
 * Abstract base adapter for Lightning Network node connections
 */
export abstract class LightningNodeAdapter implements LightningNodeConnection {
  /**
   * The client instance used for communication with the node
   */
  protected client: any = null;

  /**
   * Creates a new Lightning Node adapter
   * @param connectionDetails Details for connecting to the node
   */
  constructor(protected connectionDetails: ConnectionDetails) {
    logger.info('Creating Lightning Node adapter', {
      component: 'lightning-node-adapter',
      connectionMethod: connectionDetails.method,
    });
  }

  /**
   * Get the connection to the Lightning Network node
   * @returns The connection object
   */
  getConnection(): any {
    if (!this.client) {
      this.client = this.createClient();
    }
    return this.client;
  }

  /**
   * Check if the connection is working
   * @returns Promise that resolves to true if connection is successful
   */
  abstract checkConnection(): Promise<boolean>;

  /**
   * Get information about the connected node
   * @returns Promise resolving to node information
   */
  abstract getNodeInfo(): Promise<NodeInfo>;

  /**
   * Close the connection
   */
  abstract close(): void;

  /**
   * Create a client for the specific node implementation
   * @returns The client instance
   * @protected
   */
  protected abstract createClient(): any;
}
