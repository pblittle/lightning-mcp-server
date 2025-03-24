/**
 * @fileoverview Health criteria value object for Lightning channels.
 *
 * This file defines a value object for channel health criteria with validation,
 * default values, and methods for determining channel health.
 */

import { z } from 'zod';
import { Capacity } from './Capacity';
import { Balance } from './Balance';

/**
 * Schema for validating health criteria values
 */
export const HealthCriteriaSchema = z
  .object({
    minLocalRatio: z.number().min(0).max(1),
    maxLocalRatio: z.number().min(0).max(1),
  })
  .refine((data) => data.minLocalRatio < data.maxLocalRatio, {
    message: 'minLocalRatio must be less than maxLocalRatio',
  });

/**
 * Type for health criteria parameters
 */
export type HealthCriteriaParams = z.infer<typeof HealthCriteriaSchema>;

/**
 * Health criteria value object to represent channel health thresholds.
 * Encapsulates validation and health determination logic.
 */
export class HealthCriteria {
  private readonly minLocalRatio: number;
  private readonly maxLocalRatio: number;

  private constructor(params: HealthCriteriaParams) {
    this.minLocalRatio = params.minLocalRatio;
    this.maxLocalRatio = params.maxLocalRatio;
  }

  /**
   * Creates a new HealthCriteria instance with validation
   *
   * @param params Health criteria parameters
   * @returns HealthCriteria instance
   * @throws Error if parameters are invalid
   */
  static create(params: HealthCriteriaParams): HealthCriteria {
    const result = HealthCriteriaSchema.safeParse(params);
    if (!result.success) {
      throw new Error(`Invalid health criteria: ${result.error.message}`);
    }
    return new HealthCriteria(params);
  }

  /**
   * Creates a default HealthCriteria instance with 20/80 balance distribution
   */
  static default(): HealthCriteria {
    return new HealthCriteria({
      minLocalRatio: 0.2,
      maxLocalRatio: 0.8,
    });
  }

  /**
   * Get minimum local balance ratio
   */
  getMinLocalRatio(): number {
    return this.minLocalRatio;
  }

  /**
   * Get maximum local balance ratio
   */
  getMaxLocalRatio(): number {
    return this.maxLocalRatio;
  }

  /**
   * Determine if a channel is healthy based on these criteria
   *
   * @param localBalance Local balance of the channel
   * @param capacity Total capacity of the channel
   * @returns True if the channel balance distribution is healthy
   */
  isChannelHealthy(localBalance: Balance, capacity: Capacity): boolean {
    return localBalance.isHealthy(capacity, this.minLocalRatio, this.maxLocalRatio);
  }

  /**
   * Calculate how much rebalancing is needed to reach optimal health
   *
   * @param localBalance Local balance of the channel
   * @param capacity Total capacity of the channel
   * @returns Amount to send/receive to reach optimal balance, negative means send, positive means receive
   */
  calculateRebalanceAmount(localBalance: Balance, capacity: Capacity): number {
    // Calculate directly instead of using the ratio
    const optimalRatio = (this.minLocalRatio + this.maxLocalRatio) / 2;
    const optimalAmount = optimalRatio * capacity.getValue();

    return Math.round(optimalAmount - localBalance.getValue());
  }
}
