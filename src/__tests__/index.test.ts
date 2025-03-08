import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('dotenv');
jest.mock('../utils/logger');

// Import mocked modules
import dotenv from 'dotenv';
import logger from '../utils/logger';

describe('Application Entry Point', () => {
  let originalProcessOn: any;
  let processOnMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.on
    originalProcessOn = process.on;
    processOnMock = jest.fn();
    process.on = processOnMock as any;
  });

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();

    // Restore process.on
    process.on = originalProcessOn;
  });

  test('initializes the application correctly', () => {
    // Import the index file to trigger initialization
    jest.isolateModules(() => {
      require('../index');
    });

    // Verify environment variables are loaded
    expect(dotenv.config).toHaveBeenCalled();

    // Verify logger is used
    expect(logger.info).toHaveBeenCalledWith('Environment variables loaded');

    // Verify signal handlers are registered
    expect(processOnMock).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processOnMock).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });
});
