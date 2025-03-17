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
  alias: string;
  pubkey: string;
  color: string;
  active_channels_count: number;
  pending_channels_count: number;
  peers_count: number;
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
  local_balance: number;
  remote_balance: number;
  pending_balance: number;
  formatted: {
    local_balance: string;
    remote_balance: string;
    pending_balance: string;
  };
}

/**
 * All Balances Response
 */
export interface AllBalancesResponse {
  onchain: WalletBalanceResponse;
  channels: ChannelBalanceResponse;
  total: {
    balance: number;
    formatted: string;
  };
}
