#!/usr/bin/env node

/**
 * MCP-LND Mock Server
 *
 * This script runs the MCP server with a mocked LND connection for testing purposes.
 * It uses the compiled JavaScript files, so you need to run `npm run build` first.
 */

const path = require('path');
const fs = require('fs');
const { createMcpServer } = require('./dist/mcp/server');
const logger = require('./dist/utils/logger').default;

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

// Enable debug mode
const DEBUG = true;

// Create a mock LND client with mock implementations of all LND methods
class MockLndClient {
  constructor(config) {
    this.config = config;

    // Create a mock LND instance with all the methods we need
    this.mockLnd = {
      id: 'mock-lnd-instance',

      // Mock implementation of getWalletInfo
      getWalletInfo: async () => {
        logger.debug('Mock LND: Executing getWalletInfo');
        return {
          alias: 'mock-lnd-node',
          public_key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          version: '0.15.5-beta',
          active_channels_count: 5,
          peers_count: 10,
          block_height: 800000,
          is_synced_to_chain: true,
          is_testnet: false,
          chains: ['bitcoin'],
        };
      },

      // Mock implementation of getChainBalance
      getChainBalance: async () => {
        logger.debug('Mock LND: Executing getChainBalance');
        return {
          confirmed_balance: 1000000,
          unconfirmed_balance: 50000,
        };
      },

      // Mock implementation of getChannelBalance
      getChannelBalance: async () => {
        logger.debug('Mock LND: Executing getChannelBalance');
        return {
          channel_balance: 500000,
          pending_balance: 10000,
        };
      },

      // Mock implementation of getChannels
      getChannels: async () => {
        logger.debug('Mock LND: Executing getChannels');
        return {
          channels: [
            {
              id: 'channel-1',
              capacity: 10000000,
              local_balance: 5000000,
              remote_balance: 5000000,
            },
          ],
        };
      },

      // Mock implementation of getPeers
      getPeers: async () => {
        logger.debug('Mock LND: Executing getPeers');
        return {
          peers: [
            {
              public_key: 'peer-1',
              socket: 'peer-1:9735',
            },
          ],
        };
      },

      // Mock implementation of getNetworkInfo
      getNetworkInfo: async () => {
        logger.debug('Mock LND: Executing getNetworkInfo');
        return {
          average_channel_size: 5000000,
          channel_count: 100,
          max_channel_size: 16777215,
          min_channel_size: 20000,
          node_count: 10000,
          total_capacity: 500000000,
        };
      },

      // Mock implementation of getClosedChannels
      getClosedChannels: async () => {
        logger.debug('Mock LND: Executing getClosedChannels');
        return {
          channels: [
            {
              id: 'closed-channel-1',
              capacity: 10000000,
              close_height: 700000,
            },
          ],
        };
      },

      // Mock implementation of getPendingChannels
      getPendingChannels: async () => {
        logger.debug('Mock LND: Executing getPendingChannels');
        return {
          pending_channels: [
            {
              id: 'pending-channel-1',
              capacity: 10000000,
              is_opening: true,
            },
          ],
        };
      },

      // Mock implementation of getInvoices
      getInvoices: async () => {
        logger.debug('Mock LND: Executing getInvoices');
        return {
          invoices: [
            {
              id: 'invoice-1',
              request: 'lnbc1000...',
              tokens: 1000,
            },
          ],
        };
      },

      // Mock implementation of getPayments
      getPayments: async () => {
        logger.debug('Mock LND: Executing getPayments');
        return {
          payments: [
            {
              id: 'payment-1',
              destination: 'dest-1',
              tokens: 1000,
            },
          ],
        };
      },

      // Mock implementation of decodePaymentRequest
      decodePaymentRequest: async ({ request }) => {
        logger.debug(`Mock LND: Executing decodePaymentRequest with request: ${request}`);
        return {
          destination: 'test-destination',
          tokens: 1000,
          description: 'Test payment',
        };
      },

      // Mock implementation of createInvoice
      createInvoice: async ({ tokens, description }) => {
        logger.debug(
          `Mock LND: Executing createInvoice with tokens: ${tokens}, description: ${description}`
        );
        return {
          id: 'invoice-id',
          request: 'lnbc1000...',
          tokens: tokens || 1000,
          description: description || 'Test invoice',
        };
      },

      // Mock implementation of payViaPaymentRequest
      payViaPaymentRequest: async ({ request }) => {
        logger.debug(`Mock LND: Executing payViaPaymentRequest with request: ${request}`);
        return {
          id: 'payment-id',
          fee: 1,
          tokens: 1000,
        };
      },
    };

    logger.info('Created mock LND client with mock method implementations');
  }

  getLnd() {
    logger.debug('MockLndClient: getLnd called');
    return this.mockLnd;
  }

  async checkConnection() {
    logger.info('Mock LND connection check successful');
    return true;
  }

  close() {
    logger.info('Mock LND connection closed');
  }
}

/**
 * Run the mock server
 */
async function runMockServer() {
  try {
    logger.info('Starting MCP server with mocked LND connection');

    // Set log level to debug if DEBUG is true
    if (DEBUG) {
      process.env.LOG_LEVEL = 'debug';
      logger.level = 'debug';
      logger.debug('Debug mode enabled');
    }

    // Get configuration
    const config = {
      lnd: {
        tlsCertPath: MOCK_CERT_PATH,
        macaroonPath: MOCK_MACAROON_PATH,
        host: 'localhost',
        port: '10009',
      },
      server: {
        port: 3000,
      },
    };

    // Create mock LND client
    const mockClient = new MockLndClient(config);

    // Add debug wrapper to console.log to catch JSON parsing issues
    const originalConsoleLog = console.log;
    console.log = function () {
      const args = Array.from(arguments);
      if (DEBUG) {
        try {
          // Check if the argument is a JSON string
          if (typeof args[0] === 'string' && (args[0].startsWith('{') || args[0].startsWith('['))) {
            // Try to parse it to validate it's proper JSON
            JSON.parse(args[0]);
            logger.debug(
              `Valid JSON output: ${args[0].substring(0, 100)}${args[0].length > 100 ? '...' : ''}`
            );
          }
        } catch (error) {
          logger.error(`Invalid JSON output: ${args[0]}`);
          logger.error(`JSON parse error: ${error.message}`);

          // Log the problematic character and its position
          if (error.message.includes('position')) {
            const position = parseInt(error.message.match(/position (\d+)/)[1]);
            const problematicChar = args[0].charAt(position);
            const context = args[0].substring(
              Math.max(0, position - 20),
              Math.min(args[0].length, position + 20)
            );
            logger.error(
              `Character at position ${position}: '${problematicChar}' (charCode: ${args[0].charCodeAt(
                position
              )})`
            );
            logger.error(`Context: ...${context}...`);
          }
        }
      }

      // Call the original console.log
      originalConsoleLog.apply(console, args);
    };

    // Create and start MCP server with mock client
    logger.debug('Creating MCP server with mock client');
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
      `Error starting mock server: ${error instanceof Error ? error.message : String(error)}`
    );
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run the mock server
runMockServer();
