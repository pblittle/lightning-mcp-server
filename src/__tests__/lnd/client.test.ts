import * as lnService from 'ln-service';
import { LndClient } from '../../lnd/client';
import { Config } from '../../config';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('ln-service');
jest.mock('../../utils/logger');
jest.mock('../../utils/sanitize', () => ({
  sanitizeError: jest.fn((error) => (error instanceof Error ? error : new Error(String(error)))),
  sanitizeForLogging: jest.fn((data) => data),
}));

describe('LndClient', () => {
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {
      lnd: {
        tlsCertPath: '/path/to/tls.cert',
        macaroonPath: '/path/to/macaroon',
        host: 'localhost',
        port: '10009',
        useMockLnd: false,
      },
      server: {
        port: 3000,
        logLevel: 'info',
        environment: 'test',
      },
    };

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up default mock implementation for authenticatedLndGrpc
    (lnService.authenticatedLndGrpc as jest.Mock).mockReturnValue({});

    // Default mock for getWalletInfo
    (lnService.getWalletInfo as jest.Mock).mockResolvedValue({
      alias: 'test-node',
      public_key: 'test-pubkey',
      version: '0.15.0',
    });
  });

  describe('constructor', () => {
    test('should initialize with config and log connection details', () => {
      // Act
      new LndClient(mockConfig);

      // Assert - Check if logged with expected message and any object
      expect(logger.info).toHaveBeenCalledWith(
        'Creating LND connection to localhost:10009',
        expect.any(Object)
      );
    });
  });

  describe('createLndConnection', () => {
    test('should authenticate with LND using config values', () => {
      // Arrange
      const client = new LndClient(mockConfig);

      // Act - call private method through any cast
      const createConnection = (client as any).createLndConnection.bind(client);
      createConnection();

      // Assert
      expect(lnService.authenticatedLndGrpc).toHaveBeenCalledWith({
        cert: '/path/to/tls.cert',
        macaroon: '/path/to/macaroon',
        socket: 'localhost:10009',
      });
    });

    test('should throw error on authentication failure', () => {
      // Arrange
      const client = new LndClient(mockConfig);
      (lnService.authenticatedLndGrpc as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Authentication failed');
      });

      // Act - call private method through any cast
      const createConnection = (client as any).createLndConnection.bind(client);

      // Assert
      expect(() => createConnection()).toThrow(/LND connection error/);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getLnd', () => {
    test('should create connection if not already created', () => {
      // Arrange
      const client = new LndClient(mockConfig);
      const createConnectionSpy = jest.spyOn(client as any, 'createLndConnection');

      // Act
      client.getLnd();

      // Assert
      expect(createConnectionSpy).toHaveBeenCalled();
    });

    test('should reuse existing connection if available', () => {
      // Arrange
      const client = new LndClient(mockConfig);
      const createConnectionSpy = jest.spyOn(client as any, 'createLndConnection');

      // Act - call twice
      client.getLnd();
      client.getLnd();

      // Assert - should only create connection once
      expect(createConnectionSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkConnection', () => {
    test('should resolve to true if connection is successful', async () => {
      // Arrange
      const client = new LndClient(mockConfig);

      // Act
      const result = await client.checkConnection();

      // Assert
      expect(result).toBe(true);
      expect(lnService.getWalletInfo).toHaveBeenCalled();

      // Updated to check for the enhanced logging format
      expect(logger.info).toHaveBeenCalledWith(
        'LND connection successful',
        expect.objectContaining({
          component: 'lnd-client',
          operation: 'checkConnection',
        })
      );
    });

    test('should throw an error if connection check fails', async () => {
      // Arrange
      const client = new LndClient(mockConfig);

      // Mock getWalletInfo to throw an error
      (lnService.getWalletInfo as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      // Act & Assert
      await expect(client.checkConnection()).rejects.toThrow(/LND connection check failed/);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    test('should log a message when closing the connection', () => {
      // Arrange
      const client = new LndClient(mockConfig);
      client.getLnd(); // Create connection first

      // Act
      client.close();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('LND connection closed');
    });

    test('should handle errors gracefully', () => {
      // Arrange
      const client = new LndClient(mockConfig);

      // Mock logger.info to throw an error to test error handling
      (logger.info as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger error');
      });

      // Act & Assert
      expect(() => client.close()).not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
