/**
 * @fileoverview Factory for creating Lightning Network gateways.
 *
 * Applies Factory Pattern to create the appropriate gateway implementation
 * based on the node implementation type.
 */

import { LightningNetworkGateway } from '../../domain/lightning/gateways/LightningNetworkGateway';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { LndGateway } from '../lnd/LndGateway';
import { NodeImplementation } from '../../domain/node/ConnectionAuth';
import logger from '../../core/logging/logger';

/**
 * Factory for creating Lightning Network gateways
 */
export class LightningNetworkGatewayFactory {
  /**
   * Create a gateway based on the connection type
   * @param connection Lightning Network node connection
   * @param nodeType The type of Lightning node implementation
   * @returns Appropriate gateway implementation
   * @throws Error if the node type is not supported
   */
  static create(
    connection: LightningNodeConnection,
    nodeType: NodeImplementation
  ): LightningNetworkGateway {
    logger.info(`Creating gateway for ${nodeType} connection`, {
      component: 'gateway-factory',
      operation: 'create',
      nodeType,
    });

    // For now, we only support LND
    if (nodeType === NodeImplementation.LND) {
      return new LndGateway(connection);
    }

    // All other implementations throw a clear error
    throw new Error(
      `Lightning node implementation not supported for gateway: ${nodeType}. ` +
        `Currently, only ${NodeImplementation.LND} is supported.`
    );
  }
}
