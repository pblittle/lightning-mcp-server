/**
 * Unit tests for configuration module.
 * Tests config loading, validation, and error handling.
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from './index';
import logger from '../logging/logger';

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
    test('returns correct configuration with mock LND', () => {
      // Arrange
      process.env.USE_MOCK_LND = 'true';

      // Act
      const config = getConfig();

      // Assert
      expect(config).toEqual({
        lnd: {
          tlsCertPath: expect.any(String),
          macaroonPath: expect.any(String),
          host: 'localhost',
          port: '10009',
          useMockLnd: true,
        },
        server: {
          port: 3000,
          logLevel: 'info',
          environment: 'test',
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    test('returns correct configuration with real LND', () => {
      // Arrange
      process.env.USE_MOCK_LND = 'false';
      process.env.LND_TLS_CERT_PATH = '/path/to/tls.cert';
      process.env.LND_MACAROON_PATH = '/path/to/macaroon';
      process.env.LND_HOST = 'lnd.example.com';
      process.env.LND_PORT = '10010';

      // Act
      const config = getConfig();

      // Assert
      expect(config).toEqual({
        lnd: {
          tlsCertPath: '/path/to/tls.cert',
          macaroonPath: '/path/to/macaroon',
          host: 'lnd.example.com',
          port: '10010',
          useMockLnd: false,
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
      process.env.USE_MOCK_LND = 'false';
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
      process.env.USE_MOCK_LND = 'false';
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
      process.env.USE_MOCK_LND = 'true';

      // Mock existsSync to return false for mock files
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
      process.env.USE_MOCK_LND = 'true';
      process.env.PORT = 'invalid';

      // Act & Assert
      expect(() => getConfig()).toThrow('Invalid server port');
    });

    test('validates LND port number', () => {
      // Arrange
      process.env.USE_MOCK_LND = 'true';
      process.env.LND_PORT = 'invalid';

      // Act & Assert
      expect(() => getConfig()).toThrow('Invalid LND port');
    });
  });
});
