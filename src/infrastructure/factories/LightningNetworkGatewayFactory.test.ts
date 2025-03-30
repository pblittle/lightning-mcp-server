/**
 * @fileoverview Tests for LightningNetworkGatewayFactory
 *
 * Unit tests for the LightningNetworkGatewayFactory class.
 */

import { LightningNetworkGatewayFactory } from './LightningNetworkGatewayFactory';
import { NodeImplementation } from '../../domain/node/ConnectionAuth';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { LndGateway } from '../lnd/LndGateway';
import { NodeInfo } from '../../domain/node/NodeInfo';

// Mock the LndGateway
jest.mock('../lnd/LndGateway');

describe('LightningNetworkGatewayFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create LND gateway for LND implementation', () => {
    // Setup
    const mockConnection: LightningNodeConnection = {
      getConnection: jest.fn(),
      checkConnection: jest.fn(),
      getNodeInfo: jest.fn().mockResolvedValue({} as NodeInfo),
      close: jest.fn(),
    };

    // Execute
    const gateway = LightningNetworkGatewayFactory.create(mockConnection, NodeImplementation.LND);

    // Verify
    expect(gateway).toBeInstanceOf(LndGateway);
    expect(LndGateway).toHaveBeenCalledWith(mockConnection);
  });

  test('should throw error for unsupported implementations', () => {
    // Setup
    const mockConnection: LightningNodeConnection = {
      getConnection: jest.fn(),
      checkConnection: jest.fn(),
      getNodeInfo: jest.fn().mockResolvedValue({} as NodeInfo),
      close: jest.fn(),
    };

    // Execute & Verify
    expect(() => {
      LightningNetworkGatewayFactory.create(mockConnection, NodeImplementation.CLN as any);
    }).toThrow(/not supported/);
  });
});
