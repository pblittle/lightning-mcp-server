/**
 * @fileoverview Tests for LndAdapter
 *
 * Unit tests for the LndAdapter class.
 */

import { LndAdapter } from './LndAdapter';
import { ConnectionMethod, LndGrpcDetails, LndLncDetails } from '../../domain/node/ConnectionAuth';
import * as lnService from 'ln-service';
import * as fs from 'fs';

// Mock ln-service and fs modules
jest.mock('ln-service');
jest.mock('fs');

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
      // Mock filesystem operations
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path === grpcDetails.tlsCertPath) {
          return '-----BEGIN CERTIFICATE-----\nMOCK_CERTIFICATE_DATA\n-----END CERTIFICATE-----';
        } else if (path === grpcDetails.macaroonPath) {
          // For macaroon, return a Buffer that can be converted to hex
          return Buffer.from('MOCK_MACAROON_DATA');
        }
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      });
      adapter = new LndAdapter(grpcDetails);
    });

    test('should create gRPC client on first getConnection call', () => {
      // Setup
      (lnService.authenticatedLndGrpc as jest.Mock).mockReturnValue({ lnd: {} });

      // Execute
      const connection = adapter.getConnection();

      // Prepare expected values for verification

      const expectedCert =
        '-----BEGIN CERTIFICATE-----\nMOCK_CERTIFICATE_DATA\n-----END CERTIFICATE-----';
      const expectedMacaroon = Buffer.from('MOCK_MACAROON_DATA').toString('hex');

      // Verify
      expect(lnService.authenticatedLndGrpc).toHaveBeenCalledWith({
        cert: expectedCert,
        macaroon: expectedMacaroon,
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
