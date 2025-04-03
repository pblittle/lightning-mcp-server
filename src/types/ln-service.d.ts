/**
 * Type declarations for ln-service module
 *
 * Defines TypeScript interfaces for ln-service API methods and response objects
 * to ensure type safety when interacting with Lightning Network nodes.
 */

declare module 'ln-service' {
  export interface AuthenticatedLnd {
    // Add any specific properties or methods if needed
  }

  export interface WalletInfo {
    alias: string;
    public_key?: string;
    color: string;
    active_channels_count: number;
    pending_channels_count: number;
    peers_count: number;
  }

  export interface Channel {
    capacity: number;
    local_balance: number;
    remote_balance: number;
    active: boolean;
    remote_pubkey: string;
    channel_point: string;
    // Add other channel properties as needed
  }

  export interface GetChannelsResult {
    channels: Channel[];
  }

  export interface NodeInfoResult {
    alias?: string;
    color?: string;
    channel_count?: number;
    // Add other node info properties as needed
  }

  export function authenticatedLndGrpc(args: {
    cert: string;
    macaroon: string;
    socket: string;
    socksProxy?: {
      host: string;
      port: number;
    };
  }): AuthenticatedLnd;

  export function getWalletInfo(args: { lnd: AuthenticatedLnd }): Promise<WalletInfo>;

  export function getChannels(args: { lnd: AuthenticatedLnd }): Promise<GetChannelsResult>;

  export function getNodeInfo(args: {
    lnd: AuthenticatedLnd;
    public_key: string;
  }): Promise<NodeInfoResult>;
}
