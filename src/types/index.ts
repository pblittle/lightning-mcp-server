/**
 * MCP Query Request
 */
export interface McpQueryRequest {
  query: string;
}

/**
 * MCP Query Response
 */
export interface McpQueryResponse {
  query: string;
  response: string;
  node_data: NodeData;
}

/**
 * Node Data
 */
export interface NodeData {
  node_info: {
    alias: string;
    identity_pubkey: string;
    version: string;
    num_active_channels: number;
    num_peers: number;
    block_height: number;
    synced_to_chain: boolean;
    testnet: boolean;
    chains: string[];
  };
  wallet_balance: {
    total_balance: string | number;
    confirmed_balance: string | number;
    unconfirmed_balance: string | number;
  };
  channel_balance: {
    balance: string | number;
    pending_open_balance: string | number;
  };
}

/**
 * Wallet Balance Response
 */
export interface WalletBalanceResponse {
  total_balance: number;
  confirmed_balance: number;
  unconfirmed_balance: number;
  formatted: {
    total_balance: string;
    confirmed_balance: string;
    unconfirmed_balance: string;
  };
}

/**
 * Channel Balance Response
 */
export interface ChannelBalanceResponse {
  balance: number;
  pending_open_balance: number;
  formatted: {
    balance: string;
    pending_open_balance: string;
  };
}

/**
 * All Balances Response
 */
export interface AllBalancesResponse {
  onchain: {
    total_balance: number;
    confirmed_balance: number;
    unconfirmed_balance: number;
    formatted: {
      total_balance: string;
      confirmed_balance: string;
      unconfirmed_balance: string;
    };
  };
  channels: {
    balance: number;
    pending_open_balance: number;
    formatted: {
      balance: string;
      pending_open_balance: string;
    };
  };
  total: {
    balance: number;
    formatted: string;
  };
}
