/**
 * @fileoverview Tests for channel value objects
 */

import { Capacity } from './Capacity';
import { Balance } from './Balance';
import { HealthCriteria } from './HealthCriteria';

describe('Value Objects', () => {
  describe('Capacity', () => {
    test('should create a valid capacity', () => {
      const capacity = Capacity.create(1000000);
      expect(capacity.getValue()).toBe(1000000);
    });

    test('should throw an error for invalid capacity', () => {
      expect(() => Capacity.create(-100)).toThrow();
      expect(() => Capacity.create(0)).toThrow();
    });

    test('should format capacity correctly', () => {
      const capacity = Capacity.create(1000000);
      expect(capacity.formatSats()).toBe('1,000,000 sats');
      expect(capacity.formatBtc()).toBe('0.01000000');
      expect(capacity.format()).toContain('0.01000000 BTC');
      expect(capacity.format()).toContain('1,000,000 sats');
    });

    test('should compare capacities correctly', () => {
      const small = Capacity.create(1000000);
      const large = Capacity.create(2000000);

      expect(small.isLessThan(large)).toBe(true);
      expect(large.isGreaterThan(small)).toBe(true);
      expect(small.isGreaterThan(large)).toBe(false);
    });

    test('should calculate percentage correctly', () => {
      const part = Capacity.create(250000);
      const whole = Capacity.create(1000000);

      expect(part.percentageOf(whole)).toBe(25);
    });
  });

  describe('Balance', () => {
    test('should create a valid balance', () => {
      const balance = Balance.create(500000);
      expect(balance.getValue()).toBe(500000);
    });

    test('should accept zero balance', () => {
      const balance = Balance.create(0);
      expect(balance.getValue()).toBe(0);
    });

    test('should create a zero balance', () => {
      const balance = Balance.zero();
      expect(balance.getValue()).toBe(0);
    });

    test('should throw an error for invalid balance', () => {
      expect(() => Balance.create(-100)).toThrow();
    });

    test('should format balance correctly', () => {
      const balance = Balance.create(500000);
      expect(balance.formatSats()).toBe('500,000 sats');
      expect(balance.format()).toContain('0.00500000 BTC');
      expect(balance.format()).toContain('500,000 sats');
    });

    test('should calculate ratios correctly', () => {
      const balance = Balance.create(250000);
      const capacity = Capacity.create(1000000);

      expect(balance.ratioOf(capacity)).toBe(0.25);
      expect(balance.percentageOf(capacity)).toBe(25);
    });

    test('should determine health correctly', () => {
      const balance = Balance.create(250000);
      const capacity = Capacity.create(1000000);

      expect(balance.isHealthy(capacity, 0.2, 0.8)).toBe(true);
      expect(balance.isHealthy(capacity, 0.3, 0.8)).toBe(false);
    });

    test('should add balances correctly', () => {
      const balance1 = Balance.create(250000);
      const balance2 = Balance.create(350000);
      const sum = balance1.add(balance2);

      expect(sum.getValue()).toBe(600000);
    });
  });

  describe('HealthCriteria', () => {
    test('should create valid health criteria', () => {
      const criteria = HealthCriteria.create({
        minLocalRatio: 0.2,
        maxLocalRatio: 0.8,
      });

      expect(criteria.getMinLocalRatio()).toBe(0.2);
      expect(criteria.getMaxLocalRatio()).toBe(0.8);
    });

    test('should create default health criteria', () => {
      const criteria = HealthCriteria.default();

      expect(criteria.getMinLocalRatio()).toBe(0.2);
      expect(criteria.getMaxLocalRatio()).toBe(0.8);
    });

    test('should throw an error for invalid criteria', () => {
      expect(() =>
        HealthCriteria.create({
          minLocalRatio: 0.8,
          maxLocalRatio: 0.2,
        })
      ).toThrow();

      expect(() =>
        HealthCriteria.create({
          minLocalRatio: -0.1,
          maxLocalRatio: 0.5,
        })
      ).toThrow();

      expect(() =>
        HealthCriteria.create({
          minLocalRatio: 0.1,
          maxLocalRatio: 1.5,
        })
      ).toThrow();
    });

    test('should correctly determine channel health', () => {
      const criteria = HealthCriteria.create({
        minLocalRatio: 0.3,
        maxLocalRatio: 0.7,
      });

      const capacity = Capacity.create(1000000);
      const healthyBalance = Balance.create(400000);
      const lowBalance = Balance.create(200000);
      const highBalance = Balance.create(800000);

      expect(criteria.isChannelHealthy(healthyBalance, capacity)).toBe(true);
      expect(criteria.isChannelHealthy(lowBalance, capacity)).toBe(false);
      expect(criteria.isChannelHealthy(highBalance, capacity)).toBe(false);
    });

    test('should calculate correct rebalance amounts', () => {
      const criteria = HealthCriteria.create({
        minLocalRatio: 0.2,
        maxLocalRatio: 0.8,
      });

      const capacity = Capacity.create(1000000);

      // Balanced channel (optimal is 50%)
      const balancedAmount = Balance.create(500000);
      expect(criteria.calculateRebalanceAmount(balancedAmount, capacity)).toBe(0);

      // Too low local balance
      const lowAmount = Balance.create(100000);
      expect(criteria.calculateRebalanceAmount(lowAmount, capacity)).toBe(400000); // Need to receive

      // Too high local balance
      const highAmount = Balance.create(900000);
      expect(criteria.calculateRebalanceAmount(highAmount, capacity)).toBe(-400000); // Need to send
    });
  });
});
