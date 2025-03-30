/**
 * Unit tests for configuration module.
 * Tests config loading, validation, and error handling.
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from './index';
import logger from '../logging/logger';
import { NodeImplementation, ConnectionMethod } from '../../domain/node/ConnectionAuth';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../logging/logger');

describe('Configuration', () => {
  // Save original environment
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };

    // Mock existsSync to return true for all paths
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock path.resolve to return predictable paths
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Set up basic environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'info';
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    test('returns correct configuration with mock mode', () => {
      // Arrange
      process.env.CONNECTION_TYPE = 'mock';
      process.env.NODE_IMPLEMENTATION = NodeImplementation.LND;

      // Mocking is needed for test only, no need to set paths
      delete process.env.LND_TLS_CERT_PATH;
      delete process.env.LND_MACAROON_PATH;

      // Act
      const config = getConfig();

      // Assert
      expect(config).toEqual({
        node: {
          implementation: NodeImplementation.LND,
          connectionMethod: ConnectionMethod.GRPC, // Mock defaults to GRPC
          lnd: {
            tlsCertPath: expect.any(String),
            macaroonPath: expect.any(String),
            host: 'localhost',
            port: '10009',
          },
        },
        server: {
          port: 3000,
          logLevel: 'info',
          environment: 'test',
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    test('returns correct configuration with lnd-direct mode', () => {
      // Arrange
      process.env.CONNECTION_TYPE = 'lnd-direct';
      process.env.NODE_IMPLEMENTATION = NodeImplementation.LND;
      process.env.LND_TLS_CERT_PATH = '/path/to/tls.cert';
      process.env.LND_MACAROON_PATH = '/path/to/macaroon';
      process.env.LND_HOST = 'lnd.example.com';
      process.env.LND_PORT = '10010';

      // Act
      const config = getConfig();

      // Assert
      expect(config).toEqual({
        node: {
          implementation: NodeImplementation.LND,
          connectionMethod: ConnectionMethod.GRPC,
          lnd: {
            tlsCertPath: '/path/to/tls.cert',
            macaroonPath: '/path/to/macaroon',
            host: 'lnd.example.com',
            port: '10010',
          },
        },
        server: {
          port: 3000,
          logLevel: 'info',
          environment: 'test',
        },
      });
    });

    test('throws error if TLS certificate file does not exist', () => {
      // Arrange
      process.env.CONNECTION_TYPE = 'lnd-direct';
      process.env.LND_TLS_CERT_PATH = '/path/to/tls.cert';
      process.env.LND_MACAROON_PATH = '/path/to/macaroon';

      // Mock existsSync to return false for TLS cert
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        if (p === '/path/to/tls.cert') {
          return false;
        }
        return true;
      });

      // Act & Assert
      expect(() => getConfig()).toThrow('TLS certificate file not found');
      expect(logger.error).toHaveBeenCalled();
    });

    test('throws error if macaroon file does not exist', () => {
      // Arrange
      process.env.CONNECTION_TYPE = 'lnd-direct';
      process.env.LND_TLS_CERT_PATH = '/path/to/tls.cert';
      process.env.LND_MACAROON_PATH = '/path/to/macaroon';

      // Mock existsSync to return false for macaroon
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        if (p === '/path/to/macaroon') {
          return false;
        }
        return true;
      });

      // Act & Assert
      expect(() => getConfig()).toThrow('Macaroon file not found');
      expect(logger.error).toHaveBeenCalled();
    });

    test('creates mock files when in mock mode', () => {
      // Arrange
      process.env.CONNECTION_TYPE = 'mock';
      process.env.NODE_IMPLEMENTATION = NodeImplementation.LND;

      // Delete env vars to let the function create them
      delete process.env.LND_TLS_CERT_PATH;
      delete process.env.LND_MACAROON_PATH;

      // Mock path.resolve to return predictable paths for mock files
      (path.resolve as jest.Mock).mockImplementation((...args) => {
        if (args.includes('mock-cert.pem') || args.includes('mock-macaroon')) {
          return args.join('/');
        }
        return args.join('/');
      });

      // Mock existsSync to return false for mock directory and files
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        if (typeof p === 'string' && p.includes('mock')) {
          return false;
        }
        return true;
      });

      // Act
      getConfig();

      // Assert
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('mock LND mode'));
    });

    test('validates port numbers', () => {
      // Arrange
      process.env.CONNECTION_TYPE = 'mock';
      process.env.NODE_IMPLEMENTATION = NodeImplementation.LND;

      // Mock paths need to exist for validation to pass
      const mockCertPath = '/mock/cert.pem';
      const mockMacaroonPath = '/mock/macaroon';
      process.env.LND_TLS_CERT_PATH = mockCertPath;
      process.env.LND_MACAROON_PATH = mockMacaroonPath;

      // Set invalid port
      process.env.PORT = 'invalid';

      // Act & Assert
      expect(() => getConfig()).toThrow('Invalid server port');
    });

    test('validates LND port number', () => {
      // Arrange
      process.env.CONNECTION_TYPE = 'mock';
      process.env.NODE_IMPLEMENTATION = NodeImplementation.LND;

      // Mock paths need to exist for validation to pass
      const mockCertPath = '/mock/cert.pem';
      const mockMacaroonPath = '/mock/macaroon';
      process.env.LND_TLS_CERT_PATH = mockCertPath;
      process.env.LND_MACAROON_PATH = mockMacaroonPath;

      // Set invalid LND port
      process.env.LND_PORT = 'invalid';

      // Act & Assert
      expect(() => getConfig()).toThrow('Invalid LND port');
    });
  });
});
