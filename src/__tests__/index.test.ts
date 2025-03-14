import * as dotenv from 'dotenv';
import { bootstrap } from '../index';
import { McpServer, createMcpServer } from '../mcp/server';
import { createLndClient } from '../lnd/client';

// Mock dependencies
jest.mock('../lnd/client');

// Mock the necessary dependencies
jest.mock('../config', () => ({
  config: {
    nodeEnv: 'test',
    port: 3000,
    host: 'localhost',
    transport: 'http',
    lnd: {
      certPath: './test-cert.pem',
      macaroonPath: './test-macaroon',
      host: 'localhost',
      port: 10009,
    },
  },
  getConfig: jest.fn().mockReturnValue({
    lnd: {
      tlsCertPath: './test-cert.pem',
      macaroonPath: './test-macaroon',
      host: 'localhost',
      port: '10009',
      useMockLnd: true,
    },
    server: {
      port: 3000,
      logLevel: 'info',
      environment: 'test',
    },
  }),
}));

// Mock the MCP server module
jest.mock('../mcp/server');

// Setup mock implementation before each test
beforeEach(() => {
  // Create a mock server instance
  const mockServer = {
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  };

  // Set up mock implementations
  (McpServer as jest.Mock).mockImplementation(() => mockServer);
  (createMcpServer as jest.Mock).mockResolvedValue(mockServer);
});

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    http: jest.fn(),
  },
  logError: jest.fn(),
}));

jest.mock('dotenv', () => ({
  config: jest.fn().mockReturnValue({ parsed: {} }),
}));

describe('Application Entry Point', () => {
  const originalExit = process.exit;

  beforeAll(() => {
    // Mock process.exit
    process.exit = jest.fn() as any;
  });

  afterAll(() => {
    // Restore process.exit
    process.exit = originalExit;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes the application correctly', async () => {
    // Act & Assert
    // If bootstrap() completes without throwing an error, the test passes
    await expect(bootstrap()).resolves.not.toThrow();
  });

  test('handles initialization errors properly', async () => {
    // Arrange
    const mockError = new Error('Initialization failed');
    (createLndClient as jest.Mock).mockImplementationOnce(() => ({
      checkConnection: jest.fn().mockRejectedValue(mockError),
    }));

    // Act
    await bootstrap();

    // Assert
    const logger = require('../utils/logger').default;
    expect(logger.error).toHaveBeenCalled();
    // Since we're mocking process.exit, it should still be called by exitProcess
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
