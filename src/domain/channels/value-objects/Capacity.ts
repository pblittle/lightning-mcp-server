/**
 * @fileoverview Capacity value object for Lightning channels.
 *
 * This file defines a value object for channel capacity with validation,
 * formatting and business logic methods.
 */

import { z } from 'zod';
import { formatSatoshis, formatSatsToBtc } from '../../../core/utils/format_bitcoin';

/**
 * Schema for validating capacity values
 */
export const CapacitySchema = z.number().positive();

/**
 * Capacity value object to represent Lightning channel capacity.
 * Encapsulates validation and formatting logic.
 */
export class Capacity {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * Creates a new Capacity instance with validation
   *
   * @param value The capacity in satoshis
   * @returns Capacity instance
   * @throws Error if capacity is invalid
   */
  static create(value: number): Capacity {
    const result = CapacitySchema.safeParse(value);
    if (!result.success) {
      throw new Error(`Invalid capacity value: ${value}. Capacity must be a positive number.`);
    }
    return new Capacity(value);
  }

  /**
   * Get the raw satoshi value
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Format capacity in satoshis
   */
  formatSats(): string {
    return `${this.value.toLocaleString()} sats`;
  }

  /**
   * Format capacity in bitcoin
   */
  formatBtc(): string {
    return formatSatsToBtc(this.value);
  }

  /**
   * Format capacity with both BTC and satoshi denominations
   */
  format(): string {
    return formatSatoshis(this.value);
  }

  /**
   * Determine if this capacity is greater than another
   */
  isGreaterThan(other: Capacity): boolean {
    return this.value > other.getValue();
  }

  /**
   * Determine if this capacity is less than another
   */
  isLessThan(other: Capacity): boolean {
    return this.value < other.getValue();
  }

  /**
   * Calculate the percentage relative to another capacity
   *
   * @param total The total capacity to compare against
   * @returns Percentage as a number between 0 and 100
   */
  percentageOf(total: Capacity): number {
    return (this.value / total.getValue()) * 100;
  }
}
