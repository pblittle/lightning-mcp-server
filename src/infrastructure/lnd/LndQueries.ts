/**
 * LND query functions for interacting with the Lightning Network.
 *
 * Provides high-level abstractions for retrieving node and balance information,
 * formatting responses, and handling errors consistently.
 */

import * as lnService from 'ln-service';
import { LndClient } from './LndClient';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import { formatSatoshis } from '../../core/utils/format_bitcoin';

/**
 * Interface for wallet balance information
 */
export interface WalletBalance {
  total_balance: number;
  confirmed_balance: number;
  unconfirmed_balance: number;
  formatted: {
    total: string;
    confirmed: string;
    unconfirmed: string;
  };
}

/**
 * Interface for channel balance information
 */
export interface ChannelBalance {
  local_balance: number;
  remote_balance: number;
  pending_balance: number;
  formatted: {
    local: string;
    remote: string;
    pending: string;
  };
}

/**
 * Interface for combined balance information
 */
export interface AllBalances {
  onchain: WalletBalance;
  channels: ChannelBalance;
  total: {
    balance: number;
    formatted: string;
  };
}

/**
 * Interface for node information
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
 * Fetch wallet balance from LND node
 *
 * @param client LND client instance
 * @returns Wallet balance information
 */
export async function getWalletBalance(client: LndClient): Promise<WalletBalance> {
  const logContext = { component: 'lnd-queries', operation: 'getWalletBalance' };

  try {
    logger.info('Getting wallet balance', logContext);

    const lnd = client.getLnd();
    const walletBalance = await lnService.getChainBalance({ lnd });

    const result: WalletBalance = {
      total_balance: walletBalance.chain_balance,
      confirmed_balance: walletBalance.confirmed_chain_balance,
      unconfirmed_balance: walletBalance.unconfirmed_chain_balance,
      formatted: {
        total: formatSatoshis(walletBalance.chain_balance),
        confirmed: formatSatoshis(walletBalance.confirmed_chain_balance),
        unconfirmed: formatSatoshis(walletBalance.unconfirmed_chain_balance),
      },
    };

    logger.info(`Wallet balance: ${result.formatted.total}`, { ...logContext, balance: result });

    return result;
  } catch (error) {
    logger.error('Failed to get wallet balance', sanitizeError(error), logContext);
    throw new Error(
      `Failed to get wallet balance: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch channel balance from LND node
 *
 * @param client LND client instance
 * @returns Channel balance information
 */
export async function getChannelBalance(client: LndClient): Promise<ChannelBalance> {
  const logContext = { component: 'lnd-queries', operation: 'getChannelBalance' };

  try {
    logger.info('Getting channel balance', logContext);

    const lnd = client.getLnd();
    const channelBalance = await lnService.getChannelBalance({ lnd });

    const result: ChannelBalance = {
      local_balance: channelBalance.balance,
      remote_balance: channelBalance.inbound || 0,
      pending_balance: channelBalance.pending_balance,
      formatted: {
        local: formatSatoshis(channelBalance.balance),
        remote: formatSatoshis(channelBalance.inbound || 0),
        pending: formatSatoshis(channelBalance.pending_balance),
      },
    };

    logger.info(`Channel balance: ${result.formatted.local}`, { ...logContext, balance: result });

    return result;
  } catch (error) {
    logger.error('Failed to get channel balance', sanitizeError(error), logContext);
    throw new Error(
      `Failed to get channel balance: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch combined wallet and channel balances
 *
 * @param client LND client instance
 * @returns Combined balance information
 */
export async function getAllBalances(client: LndClient): Promise<AllBalances> {
  const logContext = { component: 'lnd-queries', operation: 'getAllBalances' };

  try {
    logger.info('Getting all balances', logContext);

    const onchain = await getWalletBalance(client);
    const channels = await getChannelBalance(client);

    const totalBalance = onchain.total_balance + channels.local_balance;

    const result: AllBalances = {
      onchain,
      channels,
      total: {
        balance: totalBalance,
        formatted: formatSatoshis(totalBalance),
      },
    };

    logger.info(`All balances: ${result.total.formatted} total`, {
      ...logContext,
      balances: result,
    });

    return result;
  } catch (error) {
    logger.error('Failed to get all balances', sanitizeError(error), logContext);
    throw new Error(
      `Failed to get all balances: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch node information from LND
 *
 * @param client LND client instance
 * @returns Node data
 */
export async function getNodeData(client: LndClient): Promise<NodeData> {
  const logContext = { component: 'lnd-queries', operation: 'getNodeData' };

  try {
    logger.info('Getting node data', logContext);

    const lnd = client.getLnd();
    const info = await lnService.getWalletInfo({ lnd });

    const result: NodeData = {
      alias: info.alias,
      pubkey: info.public_key,
      color: info.color,
      active_channels_count: info.active_channels_count,
      pending_channels_count: info.pending_channels_count,
      peers_count: info.peers_count,
    };

    logger.info(`Node data retrieved for ${result.alias}`, { ...logContext, node: result });

    return result;
  } catch (error) {
    logger.error('Failed to get node data', sanitizeError(error), logContext);
    throw new Error(
      `Failed to get node data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
