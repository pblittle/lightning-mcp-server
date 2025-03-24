/**
 * @fileoverview Channel entity for Lightning Network channels.
 *
 * This file defines a domain entity for Lightning Network channels
 * using value objects for better domain modeling and validation.
 */

import { Capacity } from '../value-objects/Capacity';
import { Balance } from '../value-objects/Balance';
import { HealthCriteria } from '../value-objects/HealthCriteria';

/**
 * Type for channel creation parameters
 */
export interface ChannelParams {
  capacity: number;
  localBalance: number;
  remoteBalance: number;
  active: boolean;
  remotePubkey: string;
  channelPoint: string;
  remoteAlias?: string;
}

/**
 * Channel entity representing a Lightning Network payment channel
 */
export class Channel {
  private readonly capacity: Capacity;
  private readonly localBalance: Balance;
  private readonly remoteBalance: Balance;
  private readonly active: boolean;
  private readonly remotePubkey: string;
  private readonly channelPoint: string;
  private readonly remoteAlias?: string;
  private error?: { type: string; message: string };

  private constructor(params: ChannelParams) {
    this.capacity = Capacity.create(params.capacity);
    this.localBalance = Balance.create(params.localBalance);
    this.remoteBalance = Balance.create(params.remoteBalance);
    this.active = params.active;
    this.remotePubkey = params.remotePubkey;
    this.channelPoint = params.channelPoint;
    this.remoteAlias = params.remoteAlias;
  }

  /**
   * Creates a new Channel instance with validation
   *
   * @param params Channel parameters
   * @returns Channel instance
   */
  static create(params: ChannelParams): Channel {
    return new Channel(params);
  }

  /**
   * Creates a Channel from raw channel data
   *
   * @param data Raw channel data
   * @returns Channel instance
   */
  static fromRaw(data: {
    capacity: number;
    local_balance: number;
    remote_balance: number;
    active: boolean;
    remote_pubkey: string;
    channel_point: string;
    remote_alias?: string;
    _error?: { type: string; message: string };
  }): Channel {
    const channel = new Channel({
      capacity: data.capacity,
      localBalance: data.local_balance,
      remoteBalance: data.remote_balance,
      active: data.active,
      remotePubkey: data.remote_pubkey,
      channelPoint: data.channel_point,
      remoteAlias: data.remote_alias,
    });

    if (data._error) {
      channel.setError(data._error);
    }

    return channel;
  }

  /**
   * Set error information
   */
  setError(error: { type: string; message: string }): void {
    this.error = error;
  }

  /**
   * Get capacity
   */
  getCapacity(): Capacity {
    return this.capacity;
  }

  /**
   * Get local balance
   */
  getLocalBalance(): Balance {
    return this.localBalance;
  }

  /**
   * Get remote balance
   */
  getRemoteBalance(): Balance {
    return this.remoteBalance;
  }

  /**
   * Check if channel is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get remote node public key
   */
  getRemotePubkey(): string {
    return this.remotePubkey;
  }

  /**
   * Get channel point (funding transaction outpoint)
   */
  getChannelPoint(): string {
    return this.channelPoint;
  }

  /**
   * Get remote node alias
   */
  getRemoteAlias(): string {
    return this.remoteAlias || 'Unknown';
  }

  /**
   * Get error information
   */
  getError(): { type: string; message: string } | undefined {
    return this.error;
  }

  /**
   * Check if channel has an error
   */
  hasError(): boolean {
    return !!this.error;
  }

  /**
   * Check if channel is balanced according to health criteria
   */
  isBalanced(criteria: HealthCriteria): boolean {
    return criteria.isChannelHealthy(this.localBalance, this.capacity);
  }

  /**
   * Calculate the local balance ratio
   */
  localBalanceRatio(): number {
    return this.localBalance.ratioOf(this.capacity);
  }

  /**
   * Calculate the remote balance ratio
   */
  remoteBalanceRatio(): number {
    return this.remoteBalance.ratioOf(this.capacity);
  }

  /**
   * Calculate recommended rebalance amount based on health criteria
   */
  calculateRebalanceAmount(criteria: HealthCriteria): number {
    return criteria.calculateRebalanceAmount(this.localBalance, this.capacity);
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON(): {
    capacity: number;
    local_balance: number;
    remote_balance: number;
    active: boolean;
    remote_pubkey: string;
    channel_point: string;
    remote_alias?: string;
    _error?: { type: string; message: string };
  } {
    const result: any = {
      capacity: this.capacity.getValue(),
      local_balance: this.localBalance.getValue(),
      remote_balance: this.remoteBalance.getValue(),
      active: this.active,
      remote_pubkey: this.remotePubkey,
      channel_point: this.channelPoint,
    };

    if (this.remoteAlias) {
      result.remote_alias = this.remoteAlias;
    }

    if (this.error) {
      result._error = this.error;
    }

    return result;
  }
}
