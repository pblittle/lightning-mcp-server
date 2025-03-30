/**
 * @fileoverview Connection types and details for Lightning Node connections.
 *
 * Defines type-safe configuration for different Lightning Node implementations
 * and connection methods.
 */

/**
 * Supported Lightning Network node implementations.
 *
 * Note: Currently, only LND is implemented. Other implementations
 * are defined here for type safety but will throw an error if used.
 */
export enum NodeImplementation {
  /**
   * Lightning Network Daemon (LND) implementation.
   * Status: Fully implemented.
   */
  LND = 'lnd',

  /**
   * Core Lightning (CLN) implementation.
   * Status: Not yet implemented.
   * @todo Implement CLN support
   */
  CLN = 'cln',

  /**
   * Eclair implementation.
   * Status: Not yet implemented.
   * @todo Implement Eclair support
   */
  ECLAIR = 'eclair',
}

/**
 * Connection methods for Lightning Network nodes.
 */
export enum ConnectionMethod {
  /**
   * gRPC connection (used with LND)
   */
  GRPC = 'grpc',

  /**
   * Lightning Node Connect (used with LND)
   */
  LNC = 'lnc',
}

/**
 * Base interface for connection details.
 */
export interface ConnectionDetails {
  /**
   * The connection method being used.
   */
  method: ConnectionMethod;
}

/**
 * Connection details for gRPC connections to LND.
 */
export interface LndGrpcDetails extends ConnectionDetails {
  method: ConnectionMethod.GRPC;
  host: string;
  port: number | string;
  tlsCertPath: string;
  macaroonPath: string;
}

/**
 * Connection details for LNC connections to LND.
 */
export interface LndLncDetails extends ConnectionDetails {
  method: ConnectionMethod.LNC;
  connectionString: string;
  pairingPhrase?: string;
}

/**
 * Union type of all supported connection details.
 */
export type SupportedConnectionDetails = LndGrpcDetails | LndLncDetails;
