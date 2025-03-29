/**
 * @fileoverview LND client for Lightning Network daemon connection.
 *
 * This module provides a client for interacting with an LND node directly
 * using ln-service. It handles connection creation, authentication, and
 * mapping of LND-specific data to domain models.
 */

import * as lnService from 'ln-service';
import { LndAuth } from '../../domain/node/ConnectionAuth';
import { NodeInfo } from '../../domain/node/NodeInfo';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import {
  ConnectionError,
  AuthenticationError,
  CredentialError,
} from '../../domain/errors/ConnectionErrors';

/**
 * Client for communicating with a Lightning Network Daemon
 */
export class LndClient {
  private readonly auth: LndAuth;
  private lndConnection: lnService.AuthenticatedLnd | null = null;

  /**
   * Creates a new LND client
   * @param auth LND authentication parameters
   */
  constructor(auth: LndAuth) {
    this.auth = auth;
    logger.info(`Creating LND connection to ${auth.host}:${auth.port}`, {
      component: 'lnd-client',
      host: auth.host,
      port: auth.port,
    });
  }

  /**
   * Gets the LND connection, creating one if it doesn't exist
   * @returns Authenticated LND connection
   */
  getConnection(): lnService.AuthenticatedLnd {
    if (!this.lndConnection) {
      this.lndConnection = this.createLndConnection();
    }
    return this.lndConnection;
  }

  /**
   * Alias for getConnection to maintain compatibility with existing code
   * @returns Authenticated LND connection
   */
  getLnd(): lnService.AuthenticatedLnd {
    return this.getConnection();
  }

  /**
   * Creates an authenticated connection to the LND node
   * @returns Authenticated LND connection
   * @private
   */
  private createLndConnection(): lnService.AuthenticatedLnd {
    try {
      logger.debug('Creating LND connection', {
        component: 'lnd-client',
        operation: 'createLndConnection',
      });

      return lnService.authenticatedLndGrpc({
        cert: this.auth.tlsCertPath,
        macaroon: this.auth.macaroonPath,
        socket: `${this.auth.host}:${this.auth.port}`,
      });
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to create LND connection', sanitizedError, {
        component: 'lnd-client',
        operation: 'createLndConnection',
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
   * Checks if the LND connection is working
   * @returns Promise that resolves to true if connection is successful
   * @throws ConnectionError if connection check fails
   */
  async checkConnection(): Promise<boolean> {
    try {
      const lnd = this.getLnd();
      const walletInfo = await lnService.getWalletInfo({ lnd });

      logger.info('LND connection successful', {
        component: 'lnd-client',
        operation: 'checkConnection',
        nodeAlias: walletInfo.alias,
        nodePubkey: walletInfo.public_key?.substring(0, 8) + '...',
      });

      return true;
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('LND connection check failed', sanitizedError, {
        component: 'lnd-client',
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
      const lnd = this.getLnd();
      const info = await lnService.getWalletInfo({ lnd });

      return {
        alias: info.alias,
        pubkey: info.public_key, // Ensure we map public_key to pubkey
        color: info.color,
        activeChannelsCount: info.active_channels_count,
        pendingChannelsCount: info.pending_channels_count,
        peersCount: info.peers_count,
      };
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to get node info', sanitizedError, {
        component: 'lnd-client',
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
      this.lndConnection = null;
      logger.info('LND connection closed');
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Error closing LND connection', {
        component: 'lnd-client',
        operation: 'close',
        error: sanitizedError.message,
      });
    }
  }
}
