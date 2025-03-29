/**
 * @fileoverview Node information interface.
 *
 * Defines the structure for Lightning Network node information.
 */

/**
 * Information about a Lightning Network node
 */
export interface NodeInfo {
  alias: string;
  pubkey: string;
  color?: string;
  activeChannelsCount?: number;
  pendingChannelsCount?: number;
  peersCount?: number;
}
