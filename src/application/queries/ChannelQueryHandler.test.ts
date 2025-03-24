/**
 * Unit tests for ChannelQueryHandler.
 * Verifies intent handling, error responses, and formatting logic.
 */

import { ChannelQueryHandler } from './ChannelQueryHandler';
import { ChannelService } from '../../domain/channels/services/ChannelService';
import { Intent } from '../../domain/intents/entities/Intent';
import { ChannelFormatter } from '../../domain/channels/formatters/ChannelFormatter';
import { Channel, ChannelQueryResult } from '../../domain/channels/entities/Channel';

// Mock dependencies
jest.mock('../../domain/channels/formatters/ChannelFormatter');
jest.mock('../../core/logging/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));
jest.mock('../../core/errors/sanitize', () => ({
  sanitizeError: jest.fn((error) => (error instanceof Error ? error : new Error(String(error)))),
}));

describe('ChannelQueryHandler', () => {
  let handler: ChannelQueryHandler;
  let mockChannelService: jest.Mocked<ChannelService>;
  let mockChannelFormatter: jest.Mocked<ChannelFormatter>;

  // Sample channel data for tests
  const sampleChannelData: ChannelQueryResult = {
    channels: [
      {
        capacity: 1000000,
        local_balance: 500000,
        remote_balance: 500000,
        active: true,
        remote_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
        channel_point: 'txid:0',
      } as Channel,
    ],
    summary: {
      totalCapacity: 1000000,
      totalLocalBalance: 500000,
      totalRemoteBalance: 500000,
      activeChannels: 1,
      inactiveChannels: 0,
      averageCapacity: 1000000,
      healthyChannels: 1,
      unhealthyChannels: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock ChannelService
    mockChannelService = {
      getChannelsWithHealth: jest.fn().mockResolvedValue(sampleChannelData),
      getUnhealthyChannels: jest.fn().mockResolvedValue({
        ...sampleChannelData,
        channels: [],
        summary: { ...sampleChannelData.summary, healthyChannels: 0, unhealthyChannels: 0 },
      }),
      healthCriteria: { minLocalRatio: 0.2, maxLocalRatio: 0.8 },
      channelRepository: jest.fn() as any,
    } as unknown as jest.Mocked<ChannelService>;

    // Set up mock formatter
    mockChannelFormatter = {
      formatChannelList: jest.fn().mockReturnValue('Formatted channel list'),
      formatChannelHealth: jest.fn().mockReturnValue('Formatted channel health'),
      formatChannelLiquidity: jest.fn().mockReturnValue('Formatted channel liquidity'),
      formatUnhealthyChannels: jest.fn().mockReturnValue('Formatted unhealthy channels'),
    } as unknown as jest.Mocked<ChannelFormatter>;

    // Apply formatter mocks
    jest
      .spyOn(ChannelFormatter.prototype, 'formatChannelList')
      .mockImplementation(mockChannelFormatter.formatChannelList);
    jest
      .spyOn(ChannelFormatter.prototype, 'formatChannelHealth')
      .mockImplementation(mockChannelFormatter.formatChannelHealth);
    jest
      .spyOn(ChannelFormatter.prototype, 'formatChannelLiquidity')
      .mockImplementation(mockChannelFormatter.formatChannelLiquidity);
    jest
      .spyOn(ChannelFormatter.prototype, 'formatUnhealthyChannels')
      .mockImplementation(mockChannelFormatter.formatUnhealthyChannels);

    // Create handler with mock dependencies
    handler = new ChannelQueryHandler(mockChannelService);
  });

  describe('Intent handling', () => {
    test('should handle channel_list intent', async () => {
      const intent: Intent = { type: 'channel_list', query: 'list my channels' };

      const result = await handler.handleQuery(intent);

      expect(result.type).toBe('channel_list');
      expect(result.response).toContain('Formatted channel list');
      expect(mockChannelService.getChannelsWithHealth).toHaveBeenCalled();
      expect(mockChannelFormatter.formatChannelList).toHaveBeenCalledWith(sampleChannelData);
    });

    test('should handle channel_health intent', async () => {
      const intent: Intent = { type: 'channel_health', query: 'how healthy are my channels' };

      const result = await handler.handleQuery(intent);

      expect(result.type).toBe('channel_health');
      expect(result.response).toContain('Formatted channel health');
      expect(mockChannelService.getChannelsWithHealth).toHaveBeenCalled();
      expect(mockChannelFormatter.formatChannelHealth).toHaveBeenCalledWith(sampleChannelData);
    });

    test('should handle channel_liquidity intent', async () => {
      const intent: Intent = { type: 'channel_liquidity', query: 'how is my channel liquidity' };

      const result = await handler.handleQuery(intent);

      expect(result.type).toBe('channel_liquidity');
      expect(result.response).toContain('Formatted channel liquidity');
      expect(mockChannelService.getChannelsWithHealth).toHaveBeenCalled();
      expect(mockChannelFormatter.formatChannelLiquidity).toHaveBeenCalledWith(sampleChannelData);
    });

    test('should handle channel_unhealthy intent', async () => {
      const intent: Intent = { type: 'channel_unhealthy', query: 'show me unhealthy channels' };

      const result = await handler.handleQuery(intent);

      expect(result.type).toBe('channel_unhealthy');
      expect(result.response).toContain('Formatted unhealthy channels');
      expect(mockChannelService.getUnhealthyChannels).toHaveBeenCalled();
      expect(mockChannelFormatter.formatUnhealthyChannels).toHaveBeenCalled();
    });

    test('should handle unknown intent', async () => {
      const intent: Intent = { type: 'unknown', query: 'what is the meaning of life' };

      const result = await handler.handleQuery(intent);

      expect(result.type).toBe('unknown');
      expect(result.response).toContain("didn't understand");
      expect(mockChannelService.getChannelsWithHealth).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('should handle errors during query processing', async () => {
      // Mock an error in channel service
      mockChannelService.getChannelsWithHealth.mockRejectedValueOnce(new Error('Test error'));

      const intent: Intent = { type: 'channel_list', query: 'list my channels' };
      const result = await handler.handleQuery(intent);

      expect(result.type).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Test error');
      expect(result.response).toContain('Error processing your query');
      expect(result.data).toBeDefined();
      expect(result.data.channels).toEqual([]);
    });
  });
});
