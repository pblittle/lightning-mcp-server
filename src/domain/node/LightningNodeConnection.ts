/**
 * @fileoverview Interface for Lightning Node connection.
 *
 * Defines a standard interface for interacting with Lightning Network nodes
 * regardless of the specific implementation (LND, LNC, etc).
 */

import { NodeInfo } from './NodeInfo';

/**
 * Generic interface for Lightning Network node connections
 */
export interface LightningNodeConnection {
  /**
   * Get the underlying connection object
   * @returns The connection object
   */
  getConnection(): any;

  /**
   * Check if the connection is working
   * @returns Promise that resolves to true if connection is successful
   */
  checkConnection(): Promise<boolean>;

  /**
   * Get information about the connected node
   * @returns Promise resolving to node information
   */
  getNodeInfo(): Promise<NodeInfo>;

  /**
   * Close the connection
   */
  close(): void;
}
