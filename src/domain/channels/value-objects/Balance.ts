/**
 * @fileoverview Balance value object for Lightning channel balances.
 *
 * This file defines a value object for channel balance with validation,
 * formatting, and methods for determining balance health.
 */

import { z } from 'zod';
import { Capacity } from './Capacity';
import { formatSatoshis } from '../../../core/utils/format_bitcoin';

/**
 * Schema for validating balance values
 * @internal
 */
const BalanceSchema = z.number().nonnegative();

/**
 * Balance value object to represent Lightning channel balances.
 * Encapsulates validation, formatting, and health metrics.
 */
export class Balance {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * Creates a new Balance instance with validation
   *
   * @param value The balance in satoshis
   * @returns Balance instance
   * @throws Error if balance is invalid
   */
  static create(value: number): Balance {
    const result = BalanceSchema.safeParse(value);
    if (!result.success) {
      throw new Error(`Invalid balance value: ${value}. Balance must be a non-negative number.`);
    }
    return new Balance(value);
  }

  /**
   * Creates a zero balance instance
   */
  static zero(): Balance {
    return new Balance(0);
  }

  /**
   * Get the raw satoshi value
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Format balance in satoshis
   */
  formatSats(): string {
    return `${this.value.toLocaleString()} sats`;
  }

  /**
   * Format balance with both BTC and satoshi denominations
   */
  format(): string {
    return formatSatoshis(this.value);
  }

  /**
   * Calculate the ratio relative to the channel capacity
   *
   * @param capacity The total capacity of the channel
   * @returns Ratio as a number between 0 and 1
   */
  ratioOf(capacity: Capacity): number {
    return this.value / capacity.getValue();
  }

  /**
   * Calculate the percentage relative to the channel capacity
   *
   * @param capacity The total capacity of the channel
   * @returns Percentage as a number between 0 and 100
   */
  percentageOf(capacity: Capacity): number {
    return this.ratioOf(capacity) * 100;
  }

  /**
   * Determine if the balance is healthy based on min/max ratios
   *
   * @param capacity Channel capacity
   * @param minRatio Minimum acceptable ratio (0-1)
   * @param maxRatio Maximum acceptable ratio (0-1)
   * @returns True if the balance ratio is within the healthy range
   */
  isHealthy(capacity: Capacity, minRatio: number, maxRatio: number): boolean {
    const ratio = this.ratioOf(capacity);
    return ratio >= minRatio && ratio <= maxRatio;
  }

  /**
   * Add another balance
   *
   * @param other Balance to add
   * @returns New Balance instance
   */
  add(other: Balance): Balance {
    return Balance.create(this.value + other.getValue());
  }
}
