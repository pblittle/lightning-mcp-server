import { ChannelQueryHandler } from '../../../mcp/handlers/channelQueryHandler';
import { LndClient } from '../../../lnd/client';
import { Intent } from '../../../types/intent';
import { ChannelFormatter } from '../../../mcp/formatters/channelFormatter';
import { Channel, HealthCriteria } from '../../../types/channel';

// Mock dependencies
jest.mock('ln-service');
jest.mock('../../../lnd/client');
jest.mock('../../../utils/logger');
jest.mock('../../../utils/sanitize', () => ({
  sanitizeError: jest.fn((error) => (error instanceof Error ? error : new Error(String(error)))),
}));
jest.mock('../../../mcp/formatters/channelFormatter');

// Use proper type for mocks
type MockLndClient = {
  getLnd: jest.Mock;
  checkConnection: jest.Mock;
  close: jest.Mock;
};

describe('ChannelQueryHandler', () => {
  let handler: ChannelQueryHandler;
  let mockLndClient: MockLndClient;
  let mockChannelFormatter: jest.Mocked<ChannelFormatter>;
  
  // Import ln-service after mocking
  const lnService = require('ln-service');

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mock LndClient
    mockLndClient = {
      getLnd: jest.fn().mockReturnValue({}),
      checkConnection: jest.fn(),
      close: jest.fn(),
    };
    
    // Set up mock formatter
    mockChannelFormatter = {
      formatChannelList: jest.fn().mockReturnValue('Formatted channel list'),
      formatChannelHealth: jest.fn().mockReturnValue('Formatted channel health'),
      formatChannelLiquidity: jest.fn().mockReturnValue('Formatted channel liquidity'),
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

    // Create handler with mock dependencies
    handler = new ChannelQueryHandler(mockLndClient as unknown as LndClient);
  });

  describe('Intent handling', () => {
    beforeEach(() => {
      // Set up mock for getChannelData to avoid real implementation
      jest.spyOn(handler as any, 'getChannelData').mockImplementation(() => {
        return Promise.resolve({
          channels: [],
          summary: {
            totalCapacity: 0,
            totalLocalBalance: 0,
            totalRemoteBalance: 0,
            activeChannels: 0,
            inactiveChannels: 0,
            averageCapacity: 0,
            healthyChannels: 0,
            unhealthyChannels: 0,
          },
        });
      });
    });

    test('should handle channel_list intent', async () => {
      const intent: Intent = { type: 'channel_list', query: 'list my channels' };
      
      const result = await handler.handleQuery(intent);
      
      expect(result.type).toBe('channel_list');
      expect(result.response).toContain('Formatted channel list');
      expect(mockChannelFormatter.formatChannelList).toHaveBeenCalled();
    });

    test('should handle channel_health intent', async () => {
      const intent: Intent = { type: 'channel_health', query: 'how healthy are my channels' };
      
      const result = await handler.handleQuery(intent);
      
      expect(result.type).toBe('channel_health');
      expect(result.response).toContain('Formatted channel health');
      expect(mockChannelFormatter.formatChannelHealth).toHaveBeenCalled();
    });

    test('should handle channel_liquidity intent', async () => {
      const intent: Intent = { type: 'channel_liquidity', query: 'how is my channel liquidity' };
      
      const result = await handler.handleQuery(intent);
      
      expect(result.type).toBe('channel_liquidity');
      expect(result.response).toContain('Formatted channel liquidity');
      expect(mockChannelFormatter.formatChannelLiquidity).toHaveBeenCalled();
    });

    test('should handle unknown intent', async () => {
      const intent: Intent = { type: 'unknown', query: 'what is the meaning of life' };
      
      const result = await handler.handleQuery(intent);
      
      expect(result.type).toBe('unknown');
      expect(result.response).toContain("didn't understand");
    });
  });

  describe('Error handling', () => {
    test('should handle errors during query processing', async () => {
      // Mock an error in getChannelData
      jest.spyOn(handler as any, 'getChannelData').mockImplementation(() => {
        return Promise.reject(new Error('Test error'));
      });
      
      const intent: Intent = { type: 'channel_list', query: 'list my channels' };
      const result = await handler.handleQuery(intent);
      
      expect(result.type).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Test error');
    });
  });

  describe('Channel data', () => {
    test('should fetch channel data from LND', async () => {
      // Set up mock channel data
      const mockChannels = [
        {
          capacity: 1000000,
          local_balance: 500000,
          remote_balance: 500000,
          active: true,
        },
      ];

      // Create a mock function for getChannels
      const mockGetChannelsFn = jest.fn(() => {
        return Promise.resolve({ channels: mockChannels });
      });
      
      // Use the mock function for getChannels
      lnService.getChannels = mockGetChannelsFn;
      
      // Call the private method directly
      const getChannelData = (handler as any).getChannelData;
      const result = await getChannelData.call(handler);
      
      expect(mockGetChannelsFn).toHaveBeenCalled();
      expect(result.channels).toEqual(mockChannels);
      expect(result.summary).toBeDefined();
    });
  });

  describe('Node aliases', () => {
    test('should add node aliases to channels', async () => {
      // Create test channels - using unknown conversion to avoid type mismatches
      const testChannels = [
        {
          capacity: 1000000,
          local_balance: 500000,
          remote_balance: 500000,
          active: true,
          remote_pubkey: 'pubkey1',
        },
        {
          capacity: 2000000,
          local_balance: 1000000,
          remote_balance: 1000000,
          active: true,
          remote_pubkey: 'pubkey2',
        },
      ] as unknown as Channel[];

      // Create a mock function for getNodeInfo
      const mockGetNodeInfoFn = jest.fn((args: any) => {
        if (args.public_key === 'pubkey1') {
          return Promise.resolve({ alias: 'Node 1' });
        } else if (args.public_key === 'pubkey2') {
          return Promise.resolve({ alias: 'Node 2' });
        }
        return Promise.reject(new Error('Unknown public key'));
      });
      
      // Use the mock function for getNodeInfo
      lnService.getNodeInfo = mockGetNodeInfoFn;
      
      // Call the private method directly
      const addNodeAliases = (handler as any).addNodeAliases;
      const result = await addNodeAliases.call(handler, testChannels);
      
      expect(result.length).toBe(2);
      expect(result[0].remote_alias).toBe('Node 1');
      expect(result[1].remote_alias).toBe('Node 2');
    });

    test('should handle errors when retrieving node aliases', async () => {
      // Create test channels - using unknown conversion to avoid type mismatches
      const testChannels = [
        {
          capacity: 1000000,
          local_balance: 500000,
          remote_balance: 500000,
          active: true,
          remote_pubkey: 'pubkey1',
        },
        {
          capacity: 2000000,
          local_balance: 1000000,
          remote_balance: 1000000,
          active: true,
          remote_pubkey: 'pubkey2',
        },
      ] as unknown as Channel[];

      // Create a mock function for getNodeInfo that fails for one pubkey
      const mockGetNodeInfoFn = jest.fn((args: any) => {
        if (args.public_key === 'pubkey1') {
          return Promise.resolve({ alias: 'Node 1' });
        }
        return Promise.reject(new Error('Node not found'));
      });
      
      // Use the mock function for getNodeInfo
      lnService.getNodeInfo = mockGetNodeInfoFn;
      
      // Call the private method directly
      const addNodeAliases = (handler as any).addNodeAliases;
      const result = await addNodeAliases.call(handler, testChannels);
      
      expect(result.length).toBe(2);
      expect(result[0].remote_alias).toBe('Node 1');
      expect(result[1].remote_alias).toBe('Unknown');
    });
  });

  describe('Channel health calculation', () => {
    test('should correctly identify healthy and unhealthy channels', () => {
      // Create test channels - using unknown conversion to avoid type mismatches
      const testChannels = [
        { capacity: 1000000, local_balance: 500000, remote_balance: 500000, active: true },
        { capacity: 1000000, local_balance: 50000, remote_balance: 950000, active: true },
        { capacity: 1000000, local_balance: 500000, remote_balance: 500000, active: false },
      ] as unknown as Channel[];
      
      // Call the private method directly
      const calculateChannelSummary = (handler as any).calculateChannelSummary;
      const summary = calculateChannelSummary.call(handler, testChannels);
      
      expect(summary.healthyChannels).toBe(1);
      expect(summary.unhealthyChannels).toBe(2);
    });

    test('should respect custom health criteria', () => {
      // Create handler with custom criteria
      const customCriteria: HealthCriteria = {
        minLocalRatio: 0.3,
        maxLocalRatio: 0.7,
      };
      
      const handlerWithCriteria = new ChannelQueryHandler(
        mockLndClient as unknown as LndClient,
        customCriteria
      );
      
      // Create test channels - using unknown conversion to avoid type mismatches
      const testChannels = [
        { capacity: 1000000, local_balance: 500000, remote_balance: 500000, active: true },
        { capacity: 1000000, local_balance: 200000, remote_balance: 800000, active: true },
      ] as unknown as Channel[];
      
      // Call the private method directly
      const calculateChannelSummary = (handlerWithCriteria as any).calculateChannelSummary;
      const summary = calculateChannelSummary.call(handlerWithCriteria, testChannels);
      
      expect(summary.healthyChannels).toBe(1);
      expect(summary.unhealthyChannels).toBe(1);
    });
  });
});
