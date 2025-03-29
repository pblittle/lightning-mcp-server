/**
 * @fileoverview Factory for creating Lightning Network gateways.
 *
 * Applies Factory Pattern to create the appropriate gateway implementation
 * based on the connection type (LND, LNC, mock).
 */

import { LightningNetworkGateway } from '../../domain/lightning/gateways/LightningNetworkGateway';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { LndGateway } from '../lnd/LndGateway';
import { LncGateway } from '../lnc/LncGateway';
import { LndClient } from '../lnd/LndClient';
import { LncClient } from '../lnc/LncClient';
import logger from '../../core/logging/logger';

/**
 * Factory for creating Lightning Network gateways
 */
export class LightningNetworkGatewayFactory {
  /**
   * Create a gateway based on the connection type
   * @param connection Lightning Network node connection
   * @returns Appropriate gateway implementation
   */
  static create(connection: LightningNodeConnection): LightningNetworkGateway {
    logger.info('Creating gateway for connection', {
      component: 'gateway-factory',
      operation: 'create',
    });

    // Determine the type of connection and create the appropriate gateway
    if (connection instanceof LndClient) {
      logger.debug('Creating LND gateway', {
        component: 'gateway-factory',
        operation: 'create',
      });
      return new LndGateway(connection);
    } else if (connection instanceof LncClient) {
      logger.debug('Creating LNC gateway', {
        component: 'gateway-factory',
        operation: 'create',
      });
      return new LncGateway(connection);
    } else {
      // For mock or unknown connections, create a mock gateway
      logger.debug('Creating mock gateway', {
        component: 'gateway-factory',
        operation: 'create',
      });
      return this.createMockGateway(connection);
    }
  }

  /**
   * Create a mock gateway for testing
   * @param connection Lightning Network node connection
   * @returns Mock gateway implementation
   * @private
   */
  private static createMockGateway(connection: LightningNodeConnection): LightningNetworkGateway {
    return {
      getConnection: () => connection,
      getChannels: async () => [],
      getNodeInfo: async () => undefined,
      getNodeAlias: async () => 'Mock Node',
    };
  }
}
