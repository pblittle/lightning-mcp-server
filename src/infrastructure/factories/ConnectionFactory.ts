/**
 * @fileoverview Factory for creating Lightning Network connections.
 *
 * Applies Factory Pattern to create the appropriate connection type
 * based on node implementation and connection method.
 */

import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { NodeImplementation, SupportedConnectionDetails } from '../../domain/node/ConnectionAuth';
import { LndAdapter } from '../adapters/LndAdapter';
import logger from '../../core/logging/logger';

/**
 * Factory for creating Lightning Network connections
 */
export class ConnectionFactory {
  /**
   * Creates a connection to a Lightning Network node
   *
   * @param implementation The type of Lightning node implementation
   * @param details Connection details specific to the implementation and connection method
   * @returns A connection to the specified Lightning node
   * @throws Error if the implementation is not supported
   */
  static createConnection(
    implementation: NodeImplementation,
    details: SupportedConnectionDetails
  ): LightningNodeConnection {
    logger.info(`Creating ${implementation} connection with ${details.method} method`, {
      component: 'connection-factory',
      nodeImplementation: implementation,
      connectionMethod: details.method,
    });

    // For now, we only support LND
    if (implementation === NodeImplementation.LND) {
      return new LndAdapter(details);
    }

    // All other implementations throw a clear error
    throw new Error(
      `Lightning node implementation not supported: ${implementation}. ` +
        `Currently, only ${NodeImplementation.LND} is supported.`
    );
  }
}
