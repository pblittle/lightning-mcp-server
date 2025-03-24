/**
 * @fileoverview Tests for Channel entity class
 */

import { Channel } from './Channel.class';
import { HealthCriteria } from '../value-objects/HealthCriteria';

describe('Channel', () => {
  const testChannelData = {
    capacity: 1000000,
    local_balance: 400000,
    remote_balance: 600000,
    active: true,
    remote_pubkey: 'test-pubkey-123',
    channel_point: 'txid:0',
    remote_alias: 'Test Node',
  };

  describe('Creation', () => {
    test('should create a channel from parameters', () => {
      const channel = Channel.create({
        capacity: 1000000,
        localBalance: 400000,
        remoteBalance: 600000,
        active: true,
        remotePubkey: 'test-pubkey-123',
        channelPoint: 'txid:0',
        remoteAlias: 'Test Node',
      });

      expect(channel.getCapacity().getValue()).toBe(1000000);
      expect(channel.getLocalBalance().getValue()).toBe(400000);
      expect(channel.getRemoteBalance().getValue()).toBe(600000);
      expect(channel.isActive()).toBe(true);
      expect(channel.getRemotePubkey()).toBe('test-pubkey-123');
      expect(channel.getRemoteAlias()).toBe('Test Node');
    });

    test('should create a channel from raw data', () => {
      const channel = Channel.fromRaw(testChannelData);

      expect(channel.getCapacity().getValue()).toBe(1000000);
      expect(channel.getLocalBalance().getValue()).toBe(400000);
      expect(channel.getRemoteBalance().getValue()).toBe(600000);
      expect(channel.isActive()).toBe(true);
      expect(channel.getRemotePubkey()).toBe('test-pubkey-123');
      expect(channel.getRemoteAlias()).toBe('Test Node');
    });

    test('should set and retrieve error information', () => {
      const channel = Channel.fromRaw(testChannelData);

      expect(channel.hasError()).toBe(false);

      channel.setError({ type: 'test-error', message: 'Test error message' });

      expect(channel.hasError()).toBe(true);
      expect(channel.getError()).toEqual({
        type: 'test-error',
        message: 'Test error message',
      });
    });

    test('should create from raw data with error', () => {
      const dataWithError = {
        ...testChannelData,
        _error: {
          type: 'test-error',
          message: 'Test error message',
        },
      };

      const channel = Channel.fromRaw(dataWithError);

      expect(channel.hasError()).toBe(true);
      expect(channel.getError()).toEqual({
        type: 'test-error',
        message: 'Test error message',
      });
    });
  });

  describe('Balance operations', () => {
    test('should calculate local and remote balance ratios', () => {
      const channel = Channel.fromRaw(testChannelData);

      expect(channel.localBalanceRatio()).toBe(0.4);
      expect(channel.remoteBalanceRatio()).toBe(0.6);
    });

    test('should determine if channel is balanced', () => {
      const channel = Channel.fromRaw(testChannelData);

      const strictCriteria = HealthCriteria.create({
        minLocalRatio: 0.45,
        maxLocalRatio: 0.55,
      });

      const looseCriteria = HealthCriteria.create({
        minLocalRatio: 0.2,
        maxLocalRatio: 0.8,
      });

      expect(channel.isBalanced(strictCriteria)).toBe(false);
      expect(channel.isBalanced(looseCriteria)).toBe(true);
    });

    test('should calculate rebalance amount', () => {
      const channel = Channel.fromRaw(testChannelData);

      const evenCriteria = HealthCriteria.create({
        minLocalRatio: 0.45,
        maxLocalRatio: 0.55,
      });

      // Should suggest to add to local balance to reach 50%
      const amount = channel.calculateRebalanceAmount(evenCriteria);
      expect(amount).toBe(100000); // Need to add 100k to local balance to reach 500k (50%)
    });
  });

  describe('Serialization', () => {
    test('should convert to JSON correctly', () => {
      const channel = Channel.fromRaw(testChannelData);

      const json = channel.toJSON();

      expect(json).toEqual({
        capacity: 1000000,
        local_balance: 400000,
        remote_balance: 600000,
        active: true,
        remote_pubkey: 'test-pubkey-123',
        channel_point: 'txid:0',
        remote_alias: 'Test Node',
      });
    });

    test('should include error in JSON if present', () => {
      const channel = Channel.fromRaw(testChannelData);
      channel.setError({ type: 'test-error', message: 'Test error message' });

      const json = channel.toJSON();

      expect(json).toEqual({
        capacity: 1000000,
        local_balance: 400000,
        remote_balance: 600000,
        active: true,
        remote_pubkey: 'test-pubkey-123',
        channel_point: 'txid:0',
        remote_alias: 'Test Node',
        _error: {
          type: 'test-error',
          message: 'Test error message',
        },
      });
    });
  });
});
