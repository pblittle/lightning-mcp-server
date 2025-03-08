import { readFileSync } from 'fs';
import * as lnService from 'ln-service';
import { Config } from '../config';
import logger from '../utils/logger';

/**
 * LND Authentication type for connecting to an LND node
 */
export interface LndAuthentication {
  /** TLS certificate content */
  cert: string;
  /** Hex-encoded macaroon for authentication */
  macaroon: string;
  /** Socket address in format host:port */
  socket: string;
}

/**
 * LND Client class to handle interactions with the Lightning Network Daemon
 */
export class LndClient {
  private lnd: lnService.AuthenticatedLnd;
  private config: Config;

  /**
   * Initialize the LND client with configuration
   * @param config Application configuration containing LND connection details
   * @throws Error if connection cannot be established
   */
  constructor(config: Config) {
    this.config = config;
    this.lnd = this.createLndConnection();
  }

  /**
   * Create LND connection with proper authentication
   * @returns Authenticated LND instance
   * @throws Error if TLS certificate or macaroon cannot be read
   */
  private createLndConnection(): lnService.AuthenticatedLnd {
    try {
      // Read the TLS certificate and macaroon files
      const tlsCert = readFileSync(this.config.lnd.tlsCertPath, 'utf8');
      const macaroon = readFileSync(this.config.lnd.macaroonPath, 'hex');

      // Create the socket string
      const socket = `${this.config.lnd.host}:${this.config.lnd.port}`;

      // Create the authentication object
      const auth: LndAuthentication = {
        cert: tlsCert,
        macaroon,
        socket,
      };

      // Create the authenticated LND client
      logger.info(`Creating LND connection to ${socket}`);
      return lnService.authenticatedLndGrpc(auth);
    } catch (error) {
      logger.fatal({ error }, 'Failed to create LND connection');
      throw new Error(
        `LND connection error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the LND client instance
   * @returns Authenticated LND instance
   */
  getLnd(): lnService.AuthenticatedLnd {
    return this.lnd;
  }

  /**
   * Check the connection to the LND node by fetching wallet info
   * @returns Promise that resolves to true when connection is confirmed
   * @throws Error if connection check fails
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Get wallet info as a simple check
      await lnService.getWalletInfo({ lnd: this.lnd });
      logger.info('LND connection successful');
      return true;
    } catch (error) {
      logger.error({ error }, 'LND connection check failed');
      throw new Error(
        `LND connection check failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Properly close the LND connection
   * Note: ln-service doesn't expose a specific close method,
   * but this method is kept for future compatibility
   */
  close(): void {
    try {
      logger.info('LND connection closed');
    } catch (error) {
      logger.error({ error }, 'Error closing LND connection');
    }
  }
}

/**
 * Create an instance of the LND client
 * @param config Application configuration
 * @returns LND client instance
 */
export function createLndClient(config: Config): LndClient {
  return new LndClient(config);
}
