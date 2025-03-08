declare module 'ln-service' {
  /**
   * Authentication configuration for LND
   */
  export interface LndAuthentication {
    cert: string;
    macaroon: string;
    socket: string;
  }

  /**
   * Authenticated LND instance
   */
  export interface AuthenticatedLnd {
    [key: string]: any;
  }

  /**
   * Create an authenticated connection to an LND node
   */
  export function authenticatedLndGrpc(auth: LndAuthentication): AuthenticatedLnd;

  /**
   * Get wallet information
   */
  export function getWalletInfo(args: { lnd: AuthenticatedLnd }): Promise<{
    alias: string;
    public_key: string;
    version: string;
    active_channels_count: number;
    peers_count: number;
    block_height: number;
    is_synced_to_chain: boolean;
    is_testnet: boolean;
    chains: string[];
    [key: string]: any;
  }>;

  /**
   * Get chain balance (on-chain wallet balance)
   */
  export function getChainBalance(args: { lnd: AuthenticatedLnd }): Promise<{
    confirmed_balance: number;
    unconfirmed_balance: number;
    [key: string]: any;
  }>;

  /**
   * Get channel balance
   */
  export function getChannelBalance(args: { lnd: AuthenticatedLnd }): Promise<{
    channel_balance: number;
    pending_balance: number;
    [key: string]: any;
  }>;
}
