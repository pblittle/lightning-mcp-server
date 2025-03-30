/**
 * @fileoverview LND adapter for Lightning Network daemon connection.
 *
 * This module provides an adapter for interacting with an LND node
 * using different connection methods (gRPC, LNC).
 */

import { LightningNodeAdapter } from './LightningNodeAdapter';
import { NodeInfo } from '../../domain/node/NodeInfo';
import {
  ConnectionDetails,
  ConnectionMethod,
  LndGrpcDetails,
  LndLncDetails,
} from '../../domain/node/ConnectionAuth';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import {
  ConnectionError,
  AuthenticationError,
  CredentialError,
  ConnectionTimeoutError,
} from '../../domain/errors/ConnectionErrors';
import * as lnService from 'ln-service';
import { LndApi } from '@lightninglabs/lnc-core';

/**
 * Adapter for communicating with a Lightning Network Daemon (LND)
 */
export class LndAdapter extends LightningNodeAdapter {
  /**
   * Creates a new LND adapter
   * @param connectionDetails Connection details for LND
   */
  constructor(connectionDetails: ConnectionDetails) {
    super(connectionDetails);
    logger.info(`Creating LND adapter with ${connectionDetails.method} connection`, {
      component: 'lnd-adapter',
      connectionMethod: connectionDetails.method,
    });
  }

  /**
   * Creates a client based on the connection method
   * @returns The client instance
   * @protected
   */
  protected createClient(): any {
    const details = this.connectionDetails;
    const method = (details as any).method;

    switch (details.method) {
      case ConnectionMethod.GRPC:
        return this.createGrpcClient(details as LndGrpcDetails);
      case ConnectionMethod.LNC:
        return this.createLncClient(details as LndLncDetails);
      default:
        throw new Error(`Unsupported connection method for LND: ${method}`);
    }
  }

  /**
   * Creates a gRPC client for LND
   * @param details gRPC connection details
   * @returns Authenticated LND gRPC client
   * @private
   */
  private createGrpcClient(details: LndGrpcDetails): lnService.AuthenticatedLnd {
    try {
      logger.debug('Creating LND gRPC connection', {
        component: 'lnd-adapter',
        operation: 'createGrpcClient',
        host: details.host,
        port: details.port,
      });

      return lnService.authenticatedLndGrpc({
        cert: details.tlsCertPath,
        macaroon: details.macaroonPath,
        socket: `${details.host}:${details.port}`,
      });
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to create LND gRPC connection', sanitizedError, {
        component: 'lnd-adapter',
        operation: 'createGrpcClient',
      });

      const errorMessage = sanitizedError.message.toLowerCase();
      // Map different error types to appropriate domain-specific errors
      if (errorMessage.includes('certificate') || errorMessage.includes('cert')) {
        throw new CredentialError(`LND certificate error: ${sanitizedError.message}`);
      } else if (
        errorMessage.includes('macaroon') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('authentication')
      ) {
        throw new AuthenticationError(`LND authentication error: ${sanitizedError.message}`);
      } else {
        throw new ConnectionError(`LND connection error: ${sanitizedError.message}`);
      }
    }
  }

  /**
   * Creates an LNC client for LND
   * @param details LNC connection details
   * @returns LNC API client
   * @private
   */
  private createLncClient(details: LndLncDetails): LndApi {
    try {
      logger.debug('Creating LNC connection', {
        component: 'lnd-adapter',
        operation: 'createLncClient',
        // Log limited info about the connection string for security
        connectionStringLength: details.connectionString?.length || 0,
        hasPairingPhrase: !!details.pairingPhrase,
      });

      // In a production implementation, we would use the actual connection
      // mechanism provided by the LNC library. For now, we simulate this with
      // a wrapper that follows the same interface.

      // Create a simulated LND API client
      const lndApi = {
        getInfo: () => Promise.resolve(this.simulateGetInfo()),
        // Add other methods as needed to satisfy the LndApi interface
      } as unknown as LndApi;

      return lndApi;
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      const errorMessage = sanitizedError.message;

      logger.error(
        'Failed to create LNC connection',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'lnd-adapter',
          operation: 'createLncClient',
        }
      );

      // Map errors to domain-specific error types based on error message content
      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('permission denied')
      ) {
        throw new AuthenticationError(`LNC authentication error: ${errorMessage}`);
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        throw new ConnectionTimeoutError(`LNC connection timed out: ${errorMessage}`);
      } else if (
        errorMessage.includes('invalid connection string') ||
        errorMessage.includes('credential') ||
        errorMessage.includes('pairing phrase')
      ) {
        throw new CredentialError(`LNC credential error: ${errorMessage}`);
      } else {
        throw new ConnectionError(`LNC connection error: ${errorMessage}`);
      }
    }
  }

  /**
   * Checks if the LND connection is working
   * @returns Promise that resolves to true if connection is successful
   * @throws ConnectionError if connection check fails
   */
  async checkConnection(): Promise<boolean> {
    try {
      const client = this.getConnection();

      if (this.connectionDetails.method === ConnectionMethod.GRPC) {
        // For gRPC, use ln-service
        const walletInfo = await lnService.getWalletInfo({ lnd: client });

        logger.info('LND connection successful', {
          component: 'lnd-adapter',
          operation: 'checkConnection',
          nodeAlias: walletInfo.alias,
          nodePubkey: walletInfo.public_key?.substring(0, 8) + '...',
        });
      } else {
        // For LNC, use LNC API
        // Note: TypeScript doesn't know about all LNC methods since @lightninglabs/lnc-core types are incomplete
        const info = await (client as any).getInfo();

        logger.info('LNC connection successful', {
          component: 'lnd-adapter',
          operation: 'checkConnection',
          nodeId: info.identity_pubkey?.substring(0, 8) + '...',
        });
      }

      return true;
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('LND connection check failed', sanitizedError, {
        component: 'lnd-adapter',
        operation: 'checkConnection',
      });

      const errorMessage = sanitizedError.message.toLowerCase();
      // Map different error types to appropriate domain-specific errors
      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('macaroon') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('unauthorized')
      ) {
        throw new AuthenticationError(`LND authentication failed: ${sanitizedError.message}`);
      } else {
        throw new ConnectionError(`LND connection check failed: ${sanitizedError.message}`);
      }
    }
  }

  /**
   * Gets information about the connected node
   * @returns Promise resolving to node information
   * @throws ConnectionError if fetching node info fails
   */
  async getNodeInfo(): Promise<NodeInfo> {
    try {
      const client = this.getConnection();

      if (this.connectionDetails.method === ConnectionMethod.GRPC) {
        // For gRPC, use ln-service
        const info = await lnService.getWalletInfo({ lnd: client });

        return {
          alias: info.alias,
          pubkey: info.public_key, // Ensure we map public_key to pubkey
          color: info.color,
          activeChannelsCount: info.active_channels_count,
          pendingChannelsCount: info.pending_channels_count,
          peersCount: info.peers_count,
        };
      } else {
        // For LNC, use LNC API or simulated data
        const info = await this.simulateGetInfo();

        return {
          alias: info.alias || 'Unknown Node',
          pubkey: info.identity_pubkey,
          color: info.color || '#000000',
          activeChannelsCount: info.num_active_channels || 0,
          pendingChannelsCount: info.num_pending_channels || 0,
          peersCount: info.num_peers || 0,
        };
      }
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to get node info', sanitizedError, {
        component: 'lnd-adapter',
        operation: 'getNodeInfo',
      });
      throw new ConnectionError(`Failed to get node info: ${sanitizedError.message}`);
    }
  }

  /**
   * Closes the LND connection
   */
  close(): void {
    try {
      this.client = null;
      logger.info('LND connection closed', {
        component: 'lnd-adapter',
        operation: 'close',
        connectionMethod: this.connectionDetails.method,
      });
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Error closing LND connection', {
        component: 'lnd-adapter',
        operation: 'close',
        error: sanitizedError.message,
      });
    }
  }

  /**
   * Simulates fetching node info - for development purposes only
   * In a production implementation, this would use the actual API
   * @returns Simulated node info
   * @private
   */
  private async simulateGetInfo(): Promise<any> {
    // This is a simulation of what the API would return
    return {
      alias: 'LNC Node',
      identity_pubkey: '03' + Array(64).fill('0').join(''),
      color: '#3399ff',
      num_active_channels: 5,
      num_pending_channels: 1,
      num_peers: 10,
    };
  }
}
