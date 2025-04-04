import { existsSync } from 'fs';
import logger from '../logging/logger';
import { sanitizeErrorMessage, sanitizeConfig } from '../errors/sanitize';
import { loadEnvironment } from './environment';
import { NodeImplementation, ConnectionMethod } from '../../domain/node/ConnectionAuth';

// Load environment configuration
loadEnvironment();

/**
 * Configuration interface
 */
export interface Config {
  /**
   * Node connection configuration
   */
  node: {
    /**
     * Type of Lightning node implementation
     * Currently only LND is supported
     */
    implementation: NodeImplementation;

    /**
     * Connection method to use
     */
    connectionMethod: ConnectionMethod;

    /**
     * LND gRPC connection configuration
     */
    lnd: {
      /** Path to the TLS certificate file */
      tlsCertPath: string;
      /** Path to the macaroon file for authentication */
      macaroonPath: string;
      /** LND host address */
      host: string;
      /** LND port number */
      port: string;
    };

    /**
     * Lightning Node Connect configuration
     */
    lnc?: {
      /** LNC connection string */
      connectionString: string;
      /** Optional pairing phrase */
      pairingPhrase?: string;
    };
  };

  /**
   * Server configuration
   */
  server: {
    /** Server port number */
    port: number;
    /** Application logging level */
    logLevel: string;
    /** Current environment (development, test, production) */
    environment: string;
  };
}

/**
 * Validate required configuration values
 */
function validateConfig(
  _implementation: NodeImplementation,
  connectionMethod: ConnectionMethod
): void {
  // When using gRPC connection, check if required files exist
  if (connectionMethod === ConnectionMethod.GRPC) {
    const tlsCertPath = process.env.LND_TLS_CERT_PATH;
    const macaroonPath = process.env.LND_MACAROON_PATH;

    if (!tlsCertPath || !macaroonPath) {
      throw new Error('Missing required LND configuration (tlsCertPath or macaroonPath)');
    }

    // Always check if files exist
    if (!existsSync(tlsCertPath)) {
      throw new Error('TLS certificate file not found');
    }

    if (!existsSync(macaroonPath)) {
      throw new Error('Macaroon file not found');
    }
  }

  // Validate LNC configuration if using LNC
  if (connectionMethod === ConnectionMethod.LNC) {
    if (!process.env.LNC_CONNECTION_STRING) {
      throw new Error('Missing required LNC configuration (connectionString)');
    }
  }

  // Validate port numbers
  const port = parseInt(process.env.PORT || '', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid server port');
  }

  if (process.env.LND_PORT) {
    const lndPort = parseInt(process.env.LND_PORT, 10);
    if (isNaN(lndPort) || lndPort <= 0 || lndPort > 65535) {
      throw new Error('Invalid LND port');
    }
  }
}

/**
 * Get configuration
 */
export function getConfig(): Config {
  try {
    // Determine connection details from environment
    const implementation =
      (process.env.NODE_IMPLEMENTATION as NodeImplementation) || NodeImplementation.LND;

    let connectionMethod: ConnectionMethod;
    // Map connection types to architecture
    if (process.env.CONNECTION_TYPE === 'lnd-direct') {
      connectionMethod = ConnectionMethod.GRPC;
    } else if (process.env.CONNECTION_TYPE === 'lnc') {
      connectionMethod = ConnectionMethod.LNC;
    } else if (process.env.CONNECTION_TYPE === 'mock') {
      // Mock mode has been removed
      throw new Error(
        'Mock mode has been removed. Use lnd-direct or lnc with a real Lightning node.'
      );
    } else {
      // Default to gRPC
      connectionMethod = ConnectionMethod.GRPC;
    }

    // Validate configuration
    validateConfig(implementation, connectionMethod);

    // Create configuration object
    const config: Config = {
      node: {
        implementation,
        connectionMethod,
        lnd: {
          tlsCertPath: process.env.LND_TLS_CERT_PATH as string,
          macaroonPath: process.env.LND_MACAROON_PATH as string,
          host: process.env.LND_HOST || 'localhost',
          port: process.env.LND_PORT || '10009',
        },
      },

      server: {
        port: parseInt(process.env.PORT || '3000', 10),
        logLevel: process.env.LOG_LEVEL || 'info',
        environment: process.env.NODE_ENV || 'development',
      },
    };

    // Add LNC config if needed
    if (connectionMethod === ConnectionMethod.LNC) {
      config.node.lnc = {
        connectionString: process.env.LNC_CONNECTION_STRING as string,
        pairingPhrase: process.env.LNC_PAIRING_PHRASE,
      };
    }

    // Log sanitized configuration
    logger.info(`Configuration loaded successfully: ${JSON.stringify(sanitizeConfig(config))}`);
    return config;
  } catch (error) {
    // Create a sanitized error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const sanitizedMessage = sanitizeErrorMessage(errorMessage);

    // Log the sanitized message
    logger.error(`Failed to load configuration: ${sanitizedMessage}`);

    // Create a new error with the sanitized message to avoid exposing sensitive information
    const sanitizedError = new Error(sanitizedMessage);
    if (error instanceof Error && error.stack) {
      sanitizedError.stack = error.stack;
    }

    // Throw the sanitized error
    throw sanitizedError;
  }
}
