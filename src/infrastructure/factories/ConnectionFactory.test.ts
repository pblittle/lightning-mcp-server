/**
 * @fileoverview Tests for ConnectionFactory
 *
 * Unit tests for the ConnectionFactory class.
 */

import { ConnectionFactory } from './ConnectionFactory';
import {
  NodeImplementation,
  ConnectionMethod,
  LndGrpcDetails,
  LndLncDetails,
} from '../../domain/node/ConnectionAuth';
import { LndAdapter } from '../adapters/LndAdapter';

// Mock the LndAdapter
jest.mock('../adapters/LndAdapter');

describe('ConnectionFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create LND adapter for LND implementation with GRPC method', () => {
    // Setup
    const details: LndGrpcDetails = {
      method: ConnectionMethod.GRPC,
      host: 'localhost',
      port: 10009,
      tlsCertPath: '/path/to/tls.cert',
      macaroonPath: '/path/to/admin.macaroon',
    };

    // Execute
    const connection = ConnectionFactory.createConnection(NodeImplementation.LND, details);

    // Verify
    expect(connection).toBeInstanceOf(LndAdapter);
    expect(LndAdapter).toHaveBeenCalledWith(details);
  });

  test('should create LND adapter for LND implementation with LNC method', () => {
    // Setup
    const details: LndLncDetails = {
      method: ConnectionMethod.LNC,
      connectionString: 'lnc://test-connection-string',
      pairingPhrase: 'test-pairing-phrase',
    };

    // Execute
    const connection = ConnectionFactory.createConnection(NodeImplementation.LND, details);

    // Verify
    expect(connection).toBeInstanceOf(LndAdapter);
    expect(LndAdapter).toHaveBeenCalledWith(details);
  });

  test('should throw error for unsupported implementations', () => {
    // Setup
    const details: LndGrpcDetails = {
      method: ConnectionMethod.GRPC,
      host: 'localhost',
      port: 10009,
      tlsCertPath: '/path/to/tls.cert',
      macaroonPath: '/path/to/admin.macaroon',
    };

    // Execute & Verify
    expect(() => {
      ConnectionFactory.createConnection(NodeImplementation.CLN as any, details);
    }).toThrow(/not supported/);
  });
});
