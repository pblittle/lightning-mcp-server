/**
 * @fileoverview Factory for creating Lightning Network connections.
 *
 * Applies Factory Pattern to create the appropriate connection type
 * based on configuration or authentication parameters.
 */

import { Config } from '../../core/config';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { LightningNodeAuth, LndAuth, LncAuth, MockAuth } from '../../domain/node/ConnectionAuth';
import { NodeInfo } from '../../domain/node/NodeInfo';
import { LndClient } from '../lnd/LndClient';
import { LncClient } from '../lnc/LncClient';
import logger from '../../core/logging/logger';

/**
 * Factory for creating Lightning Network connections
 */
export class ConnectionFactory {
  /**
   * Creates a connection based on authentication parameters
   * @param auth Authentication parameters
   * @returns Lightning Network connection
   */
  static createConnection(auth: LightningNodeAuth): LightningNodeConnection {
    logger.info(`Creating ${auth.type} connection`, {
      component: 'connection-factory',
      connectionType: auth.type,
    });

    switch (auth.type) {
      case 'lnd-direct': {
        const lndAuth = auth as LndAuth;
        const client = new LndClient(lndAuth);
        return client;
      }
      case 'lnc': {
        const lncAuth = auth as LncAuth;
        const client = new LncClient(lncAuth);
        return client;
      }
      case 'mock': {
        // Return a mock implementation with correct NodeInfo structure
        return {
          getConnection: () =>
            ({
              /* Mock LND */
            } as any),
          checkConnection: async () => true,
          getNodeInfo: async () =>
            ({
              alias: 'Mock Node',
              pubkey: 'mock-pubkey',
              color: '#000000',
              activeChannelsCount: 0,
              pendingChannelsCount: 0,
              peersCount: 0,
            } as NodeInfo),
          close: () => {
            /* No-op */
          },
        };
      }
      default:
        throw new Error(`Unsupported connection type: ${auth.type}`);
    }
  }

  /**
   * Creates a connection from application configuration
   * @param config Application configuration
   * @returns Lightning Network connection
   */
  static createFromConfig(config: Config): LightningNodeConnection {
    const connectionType = config.node.connectionType;

    logger.info(`Creating connection using factory (type: ${connectionType})`, {
      component: 'connection-factory',
      connectionType,
    });

    switch (connectionType) {
      case 'lnd-direct': {
        const lndAuth: LndAuth = {
          type: 'lnd-direct',
          tlsCertPath: config.node.lnd.tlsCertPath,
          macaroonPath: config.node.lnd.macaroonPath,
          host: config.node.lnd.host,
          port: parseInt(config.node.lnd.port, 10),
        };
        return this.createConnection(lndAuth);
      }
      case 'lnc': {
        if (!config.node.lnc || !config.node.lnc.connectionString) {
          throw new Error('Missing LNC connection string in configuration');
        }

        const lncAuth: LncAuth = {
          type: 'lnc',
          connectionString: config.node.lnc.connectionString,
          pairingPhrase: config.node.lnc.pairingPhrase,
        };
        return this.createConnection(lncAuth);
      }
      case 'mock': {
        const auth: MockAuth = { type: 'mock' };
        return this.createConnection(auth);
      }
      default:
        throw new Error(`Unsupported connection type: ${connectionType}`);
    }
  }
}
