import { jest } from '@jest/globals';

// Define types for mocked functions
type MockedFunction<T extends (...args: any) => any> = jest.MockedFunction<T>;

// Mock dependencies
jest.mock('dotenv');
jest.mock('../utils/logger');
jest.mock('../config');
jest.mock('../lnd/client');
jest.mock('../mcp/server');

// Import mocked modules
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { getConfig } from '../config';
import { createLndClient } from '../lnd/client';
import { createMcpServer } from '../mcp/server';
import { LndClient } from '../lnd/client';
import { McpServer } from '../mcp/server';

describe('Application Entry Point', () => {
  let originalProcessOn: any;
  let processOnMock: jest.Mock;
  let mockLndClient: Partial<LndClient>;
  let mockMcpServer: Partial<McpServer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.on
    originalProcessOn = process.on;
    processOnMock = jest.fn();
    process.on = processOnMock as any;

    // Mock config and client
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValue({
      lnd: {
        tlsCertPath: '/path/to/tls.cert',
        macaroonPath: '/path/to/macaroon',
        host: 'localhost',
        port: '10009',
      },
      server: {
        port: 3000,
      },
    });

    // Create properly typed mock functions
    const getLndMock = jest.fn();
    const checkConnectionMock = jest.fn().mockResolvedValue(true);
    const closeMock = jest.fn();

    mockLndClient = {
      getLnd: getLndMock,
      checkConnection: checkConnectionMock,
      close: closeMock,
    };
    (createLndClient as jest.MockedFunction<typeof createLndClient>).mockReturnValue(
      mockLndClient as LndClient
    );

    // Create properly typed mock functions for McpServer
    const startMock = jest.fn().mockResolvedValue(undefined);
    const stopMock = jest.fn().mockResolvedValue(undefined);

    mockMcpServer = {
      start: startMock,
      stop: stopMock,
    };
    (createMcpServer as jest.MockedFunction<typeof createMcpServer>).mockResolvedValue(
      mockMcpServer as unknown as McpServer
    );
  });

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();

    // Restore process.on
    process.on = originalProcessOn;
  });

  test('initializes the application correctly', async () => {
    // Import the index file to trigger initialization
    jest.isolateModules(() => {
      require('../index');
    });

    // Verify environment variables are loaded
    expect(dotenv.config).toHaveBeenCalled();

    // Verify logger is used
    expect(logger.info).toHaveBeenCalledWith('Environment variables loaded');

    // Verify config is loaded
    expect(getConfig).toHaveBeenCalled();

    // Verify LND client is created
    expect(createLndClient).toHaveBeenCalled();

    // Verify signal handlers are registered
    expect(processOnMock).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processOnMock).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });
});
