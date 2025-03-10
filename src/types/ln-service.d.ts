/**
 * Type declarations for ln-service
 *
 * This file provides type declarations for the ln-service module
 * to make TypeScript happy when using ts-node.
 */

declare module 'ln-service' {
  export interface AuthenticatedLnd {
    [key: string]: any;
  }

  export interface WalletInfo {
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
  }

  export interface ChainBalance {
    confirmed_balance: number;
    unconfirmed_balance: number;
    [key: string]: any;
  }

  export interface ChannelBalance {
    channel_balance: number;
    pending_balance: number;
    [key: string]: any;
  }

  export interface Channel {
    id: string;
    capacity: number;
    local_balance: number;
    remote_balance: number;
    [key: string]: any;
  }

  export interface Peer {
    public_key: string;
    socket: string;
    [key: string]: any;
  }

  export interface NetworkInfo {
    average_channel_size: number;
    channel_count: number;
    max_channel_size: number;
    min_channel_size: number;
    node_count: number;
    total_capacity: number;
    [key: string]: any;
  }

  export interface ClosedChannel {
    id: string;
    capacity: number;
    close_height: number;
    [key: string]: any;
  }

  export interface PendingChannel {
    id: string;
    capacity: number;
    is_opening: boolean;
    [key: string]: any;
  }

  export interface Invoice {
    id: string;
    request: string;
    tokens: number;
    [key: string]: any;
  }

  export interface Payment {
    id: string;
    destination: string;
    tokens: number;
    [key: string]: any;
  }

  export interface PaymentRequest {
    destination: string;
    tokens: number;
    description: string;
    [key: string]: any;
  }

  // Function declarations
  export function authenticatedLndGrpc(auth: {
    cert: string;
    macaroon: string;
    socket: string;
  }): AuthenticatedLnd;

  export function getWalletInfo(args: { lnd: AuthenticatedLnd }): Promise<WalletInfo>;

  export function getChainBalance(args: { lnd: AuthenticatedLnd }): Promise<ChainBalance>;

  export function getChannelBalance(args: { lnd: AuthenticatedLnd }): Promise<ChannelBalance>;

  export function getChannels(args: { lnd: AuthenticatedLnd }): Promise<{ channels: Channel[] }>;

  export function getPeers(args: { lnd: AuthenticatedLnd }): Promise<{ peers: Peer[] }>;

  export function getNetworkInfo(args: { lnd: AuthenticatedLnd }): Promise<NetworkInfo>;

  export function getClosedChannels(args: {
    lnd: AuthenticatedLnd;
  }): Promise<{ channels: ClosedChannel[] }>;

  export function getPendingChannels(args: {
    lnd: AuthenticatedLnd;
  }): Promise<{ pending_channels: PendingChannel[] }>;

  export function getInvoices(args: { lnd: AuthenticatedLnd }): Promise<{ invoices: Invoice[] }>;

  export function getPayments(args: { lnd: AuthenticatedLnd }): Promise<{ payments: Payment[] }>;

  export function decodePaymentRequest(args: {
    lnd: AuthenticatedLnd;
    request: string;
  }): Promise<PaymentRequest>;

  export function createInvoice(args: {
    lnd: AuthenticatedLnd;
    tokens: number;
    description?: string;
  }): Promise<Invoice>;

  export function payViaPaymentRequest(args: {
    lnd: AuthenticatedLnd;
    request: string;
  }): Promise<Payment>;
}
