/**
 * @fileoverview Tests for LndAdapter
 *
 * Unit tests for the LndAdapter class.
 */

import { LndAdapter } from './LndAdapter';
import { ConnectionMethod, LndGrpcDetails, LndLncDetails } from '../../domain/node/ConnectionAuth';
import * as lnService from 'ln-service';

// Mock ln-service
jest.mock('ln-service');

describe('LndAdapter', () => {
  // Test gRPC connection
  describe('with gRPC connection', () => {
    const grpcDetails: LndGrpcDetails = {
      method: ConnectionMethod.GRPC,
      host: 'localhost',
      port: 10009,
      tlsCertPath: '/path/to/tls.cert',
      macaroonPath: '/path/to/admin.macaroon',
    };

    let adapter: LndAdapter;

    beforeEach(() => {
      jest.clearAllMocks();
      adapter = new LndAdapter(grpcDetails);
    });

    test('should create gRPC client on first getConnection call', () => {
      // Setup
      (lnService.authenticatedLndGrpc as jest.Mock).mockReturnValue({ lnd: {} });

      // Execute
      const connection = adapter.getConnection();

      // Verify
      expect(lnService.authenticatedLndGrpc).toHaveBeenCalledWith({
        cert: grpcDetails.tlsCertPath,
        macaroon: grpcDetails.macaroonPath,
        socket: `${grpcDetails.host}:${grpcDetails.port}`,
      });
      expect(connection).toBeDefined();
    });

    test('should check connection successfully', async () => {
      // Setup
      (lnService.authenticatedLndGrpc as jest.Mock).mockReturnValue({ lnd: {} });
      (lnService.getWalletInfo as jest.Mock).mockResolvedValue({
        alias: 'Test Node',
        public_key: '03' + '0'.repeat(64),
        active_channels_count: 5,
      });

      // Execute
      const result = await adapter.checkConnection();

      // Verify
      expect(result).toBe(true);
      expect(lnService.getWalletInfo).toHaveBeenCalled();
    });

    test('should get node info', async () => {
      // Setup
      const mockNodeInfo = {
        alias: 'Test Node',
        public_key: '03' + '0'.repeat(64),
        color: '#000000',
        active_channels_count: 5,
        pending_channels_count: 1,
        peers_count: 10,
      };

      (lnService.authenticatedLndGrpc as jest.Mock).mockReturnValue({ lnd: {} });
      (lnService.getWalletInfo as jest.Mock).mockResolvedValue(mockNodeInfo);

      // Execute
      const nodeInfo = await adapter.getNodeInfo();

      // Verify
      expect(nodeInfo).toEqual({
        alias: 'Test Node',
        pubkey: mockNodeInfo.public_key,
        color: '#000000',
        activeChannelsCount: 5,
        pendingChannelsCount: 1,
        peersCount: 10,
      });
    });
  });

  // Test LNC connection
  describe('with LNC connection', () => {
    const lncDetails: LndLncDetails = {
      method: ConnectionMethod.LNC,
      connectionString: 'lnc://test-connection-string',
      pairingPhrase: 'test-pairing-phrase',
    };

    let adapter: LndAdapter;

    beforeEach(() => {
      jest.clearAllMocks();
      adapter = new LndAdapter(lncDetails);
    });

    test('should create LNC client on first getConnection call', () => {
      // Execute
      const connection = adapter.getConnection();

      // Verify
      expect(connection).toBeDefined();
      expect(typeof connection.getInfo).toBe('function');
    });

    test('should get node info', async () => {
      // Execute
      const nodeInfo = await adapter.getNodeInfo();

      // Verify
      expect(nodeInfo).toBeDefined();
      expect(nodeInfo.alias).toBeDefined();
      expect(nodeInfo.pubkey).toBeDefined();
    });
  });
});
