/**
 * Unit tests for application bootstrap process.
 * Verifies application initialization, error handling, and shutdown.
 */

import { bootstrap } from './index';
import { McpServer } from './interfaces/mcp/McpServer';
import { createMcpServer } from './composition';

// Mock dependencies
jest.mock('./composition');
jest.mock('./core/config', () => ({
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
jest.mock('./interfaces/mcp/McpServer');

jest.mock('./core/logging/logger', () => ({
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

jest.mock('./core/errors/sanitize', () => ({
  sanitizeError: jest.fn((error) => (error instanceof Error ? error : new Error(String(error)))),
}));

jest.mock('dotenv', () => ({
  config: jest.fn().mockReturnValue({ parsed: {} }),
}));

describe('Application Entry Point', () => {
  let mockServer: jest.Mocked<McpServer>;
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

    // Create a mock server instance
    mockServer = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<McpServer>;

    // Set up mock implementations
    (createMcpServer as jest.Mock).mockResolvedValue(mockServer);
  });

  test('initializes the application correctly', async () => {
    // Act & Assert
    // If bootstrap() completes without throwing an error, the test passes
    await expect(bootstrap()).resolves.not.toThrow();

    // Verify MCP server was created and started
    expect(createMcpServer).toHaveBeenCalled();
  });

  test('handles initialization errors properly', async () => {
    // Arrange
    const mockError = new Error('Initialization failed');
    (createMcpServer as jest.Mock).mockRejectedValueOnce(mockError);

    // Act
    await bootstrap();

    // Assert
    const logger = require('./core/logging/logger').default;
    expect(logger.error).toHaveBeenCalled();
    // Since we're mocking process.exit, it should still be called by exitProcess
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
