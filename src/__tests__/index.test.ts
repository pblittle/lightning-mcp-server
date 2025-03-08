import express from 'express';
import http from 'http';
import { setupLndConnection } from '../services/lnd';
import logger from '../utils/logger';

// Mock dependencies
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn().mockReturnValue({ on: jest.fn() }),
  };
  return jest.fn(() => mockApp);
});

jest.mock('cors', () => jest.fn());
jest.mock('body-parser', () => ({
  json: jest.fn(),
}));

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

jest.mock('../services/lnd', () => ({
  setupLndConnection: jest.fn(),
}));

jest.mock('../routes/balance', () => ({
  balanceRouter: 'mock-balance-router',
}));

jest.mock('../routes/mcp', () => ({
  mcpRouter: 'mock-mcp-router',
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  fatal: jest.fn(),
}));

describe('Application Entry Point', () => {
  let app: any;
  let originalProcessOn: any;
  let processOnMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.on
    originalProcessOn = process.on;
    processOnMock = jest.fn();
    process.on = processOnMock;

    // Reset modules to ensure clean state
    jest.resetModules();
  });

  afterEach(() => {
    // Restore process.on
    process.on = originalProcessOn;
  });

  test('initializes the application correctly', () => {
    // Import the index file to trigger initialization
    jest.isolateModules(() => {
      require('../index');
    });

    // Get the express app instance
    app = express();

    // Verify environment variables are loaded
    expect(require('dotenv').config).toHaveBeenCalled();

    // Verify middleware is configured
    expect(app.use).toHaveBeenCalled();

    // Verify LND connection is initialized
    expect(setupLndConnection).toHaveBeenCalled();

    // Verify routes are registered
    expect(app.use).toHaveBeenCalledWith('/api/balance', 'mock-balance-router');
    expect(app.use).toHaveBeenCalledWith('/api/mcp', 'mock-mcp-router');

    // Verify health check endpoint is registered
    expect(app.get).toHaveBeenCalledWith('/health', expect.any(Function));

    // Verify server is started
    expect(app.listen).toHaveBeenCalled();

    // Verify signal handlers are registered
    expect(processOnMock).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processOnMock).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });

  test('handles LND connection errors', () => {
    // Mock setupLndConnection to throw an error
    const mockError = new Error('Failed to connect to LND');
    (setupLndConnection as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    // Mock process.exit
    const originalProcessExit = process.exit;
    const processExitMock = jest.fn();
    process.exit = processExitMock as any;

    // Import the index file to trigger initialization
    jest.isolateModules(() => {
      try {
        require('../index');
      } catch (error) {
        // Expected to throw
      }
    });

    // Verify error is logged
    expect(logger.fatal).toHaveBeenCalled();

    // Verify process exit is called
    expect(processExitMock).toHaveBeenCalledWith(1);

    // Restore process.exit
    process.exit = originalProcessExit;
  });
});
