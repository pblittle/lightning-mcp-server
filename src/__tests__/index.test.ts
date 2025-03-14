import * as dotenv from 'dotenv';
import { bootstrap } from '../index';
import { McpServer } from '../mcp/server';

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
}));

jest.mock('../mcp/server', () => {
  const mockStart = jest.fn().mockResolvedValue(undefined);
  const mockStop = jest.fn().mockResolvedValue(undefined);

  return {
    McpServer: jest.fn().mockImplementation(() => ({
      start: mockStart,
      stop: mockStop,
    })),
  };
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
    // Act
    await bootstrap();

    // Assert
    expect(McpServer).toHaveBeenCalledTimes(1);
    expect(McpServer).toHaveBeenCalledWith({
      port: 3000,
      host: 'localhost',
      transport: 'http',
    });

    const mockInstance = (McpServer as jest.Mock).mock.instances[0];
    expect(mockInstance.start).toHaveBeenCalledTimes(1);
  });

  test('handles initialization errors properly', async () => {
    // Arrange
    const mockError = new Error('Initialization failed');
    (McpServer as jest.Mock).mockImplementationOnce(() => ({
      start: jest.fn().mockRejectedValue(mockError),
    }));

    // Act
    await bootstrap();

    // Assert
    const logger = require('../utils/logger').default;
    expect(logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
