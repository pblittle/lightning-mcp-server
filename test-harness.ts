#!/usr/bin/env node

/**
 * MCP-LND Test Harness
 *
 * This script runs the MCP server with a mocked LND connection for testing purposes.
 * It creates a mock LND client that uses the mock implementations from the test suite.
 */

import * as path from 'path';
import * as fs from 'fs';
import logger from './src/utils/logger';
import { Config } from './src/config';
import { getConfig } from './src/config';
import { createMcpServer } from './src/mcp/server';

// Create mock files if they don't exist
const MOCK_DIR = path.resolve(__dirname, 'mock');
const MOCK_CERT_PATH = path.resolve(MOCK_DIR, 'mock-cert.pem');
const MOCK_MACAROON_PATH = path.resolve(MOCK_DIR, 'mock-macaroon');

// Ensure mock directory exists
if (!fs.existsSync(MOCK_DIR)) {
  fs.mkdirSync(MOCK_DIR, { recursive: true });
}

// Create mock cert file if it doesn't exist
if (!fs.existsSync(MOCK_CERT_PATH)) {
  fs.writeFileSync(MOCK_CERT_PATH, 'MOCK TLS CERTIFICATE');
}

// Create mock macaroon file if it doesn't exist
if (!fs.existsSync(MOCK_MACAROON_PATH)) {
  fs.writeFileSync(MOCK_MACAROON_PATH, 'MOCK MACAROON');
}

// Override environment variables for testing
process.env.LND_TLS_CERT_PATH = MOCK_CERT_PATH;
process.env.LND_MACAROON_PATH = MOCK_MACAROON_PATH;

// Import the LndClient to extend it
import { LndClient } from './src/lnd/client';

// Create a mock LND client that extends the LndClient class
class MockLndClient extends LndClient {
  private mockLnd: any;

  constructor(config: Config) {
    // Call the parent constructor with the config
    super(config);

    // Override the lnd instance with our mock
    this.mockLnd = { id: 'mock-lnd-instance' };
    logger.info('Created mock LND client');
  }

  // Override the getLnd method to return our mock instance
  getLnd(): any {
    return this.mockLnd;
  }

  // Override the checkConnection method
  async checkConnection(): Promise<boolean> {
    logger.info('Mock LND connection check successful');
    return true;
  }

  // Override the close method
  close(): void {
    logger.info('Mock LND connection closed');
  }
}

/**
 * Run the test harness
 */
async function runTestHarness() {
  try {
    logger.info('Starting MCP server with mocked LND connection');

    // Get configuration
    const config = getConfig();

    // Create mock LND client
    const mockClient = new MockLndClient(config);

    // Create and start MCP server with mock client
    const server = await createMcpServer(mockClient, config);

    logger.info('MCP Server started with mocked LND connection');
    logger.info('Press Ctrl+C to stop');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Stopping MCP server');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error(
      `Error starting test harness: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Run the test harness
runTestHarness();
