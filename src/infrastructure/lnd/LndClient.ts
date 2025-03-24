import * as lnService from 'ln-service';
import { Config } from '../../core/config';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';

/**
 * Interface for LND authentication parameters
 */
export interface LndAuthentication {
  cert: string;
  macaroon: string;
  socket: string;
}

/**
 * Client for communicating with a Lightning Network Daemon
 */
export class LndClient {
  private config: Config;
  private lndConnection: lnService.AuthenticatedLnd | null = null;

  /**
   * Creates a new LND client with the given configuration
   * @param config The application configuration containing LND connection details
   */
  constructor(config: Config) {
    this.config = config;
    logger.info('Creating LND connection to ' + config.lnd.host + ':' + config.lnd.port, {
      component: 'lnd-client',
      host: config.lnd.host,
      port: config.lnd.port,
    });
  }

  /**
   * Creates an authenticated connection to the LND node
   */
  private createLndConnection(): lnService.AuthenticatedLnd {
    try {
      logger.debug('Creating LND connection', {
        component: 'lnd-client',
        operation: 'createLndConnection',
        host: this.config.lnd.host,
        port: this.config.lnd.port,
      });

      const authParams: LndAuthentication = {
        cert: this.config.lnd.tlsCertPath,
        macaroon: this.config.lnd.macaroonPath,
        socket: `${this.config.lnd.host}:${this.config.lnd.port}`,
      };

      return lnService.authenticatedLndGrpc(authParams);
    } catch (error) {
      const sanitizedError = sanitizeError(error);

      logger.error(
        'Failed to create LND connection',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'lnd-client',
          operation: 'createLndConnection',
          host: this.config.lnd.host,
          port: this.config.lnd.port,
        }
      );

      throw new Error(`LND connection error: ${sanitizedError.message}`);
    }
  }

  /**
   * Gets the LND connection, creating one if it doesn't exist
   */
  getLnd(): lnService.AuthenticatedLnd {
    if (!this.lndConnection) {
      logger.debug('Initializing LND connection', {
        component: 'lnd-client',
        operation: 'getLnd',
      });

      this.lndConnection = this.createLndConnection();
    }

    return this.lndConnection;
  }

  /**
   * Checks if the LND connection is working
   */
  async checkConnection(): Promise<boolean> {
    try {
      const lnd = this.getLnd();
      const walletInfo = await lnService.getWalletInfo({ lnd });

      // Call logger.info with both message and metadata to match test expectations
      logger.info('LND connection successful', {
        component: 'lnd-client',
        operation: 'checkConnection',
        nodeAlias: walletInfo.alias,
        nodePubkey: walletInfo.public_key?.substring(0, 8) + '...',
      });

      return true;
    } catch (error) {
      const sanitizedError = sanitizeError(error);

      logger.error(
        'LND connection check failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'lnd-client',
          operation: 'checkConnection',
          host: this.config.lnd.host,
          port: this.config.lnd.port,
        }
      );

      throw new Error(`LND connection check failed: ${sanitizedError.message}`);
    }
  }

  /**
   * Closes the LND connection
   */
  close(): void {
    try {
      // Clear the LND connection
      this.lndConnection = null;

      // Log with the exact message the test expects
      logger.info('LND connection closed');

      // Add more detailed log with structured metadata
      logger.debug('LND connection resources released', {
        component: 'lnd-client',
        operation: 'close',
      });
    } catch (error) {
      // Log the error but don't throw it to match test expectations
      logger.error(
        'Error closing LND connection',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'lnd-client',
          operation: 'close',
        }
      );
    }
  }
}

/**
 * Creates a new LND client with the given configuration
 */
export function createLndClient(config: Config): LndClient {
  logger.debug('Creating new LND client', {
    component: 'lnd-client',
    host: config.lnd.host,
    port: config.lnd.port,
  });

  return new LndClient(config);
}
