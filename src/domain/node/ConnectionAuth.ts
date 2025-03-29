/**
 * @fileoverview Authentication interfaces for Lightning Node connections.
 *
 * Defines type-safe authentication parameters for different connection methods.
 */

/**
 * Base authentication interface for all Lightning Network connections
 */
export interface LightningNodeAuth {
  type: 'lnd-direct' | 'lnc' | 'mock';
}

/**
 * Authentication parameters for LND direct connections
 */
export interface LndAuth extends LightningNodeAuth {
  type: 'lnd-direct';
  tlsCertPath: string;
  macaroonPath: string;
  host: string;
  port: string | number;
}

/**
 * Authentication parameters for Lightning Node Connect
 */
export interface LncAuth extends LightningNodeAuth {
  type: 'lnc';
  connectionString: string;
  pairingPhrase?: string;
}

/**
 * Authentication parameters for mock connections (testing)
 */
export interface MockAuth extends LightningNodeAuth {
  type: 'mock';
}
