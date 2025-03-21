#!/usr/bin/env node

/**
 * Fixed LND MCP Mock Server
 *
 * This server implements a simplified MCP server with mocked LND connection
 * for testing natural language channel queries.
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Debug flag - set to true for detailed logging
const DEBUG = true;

// Use a simple console logger instead of the actual logger
const logger = {
  info: (message) =>
    console.error(`[INFO] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
  warn: (message) =>
    console.error(`[WARN] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
  error: (message) =>
    console.error(`[ERROR] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
  debug: (message) =>
    DEBUG &&
    console.error(`[DEBUG] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
  fatal: (message) =>
    console.error(`[FATAL] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
};

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

// Set environment variables for testing
process.env.LND_TLS_CERT_PATH = MOCK_CERT_PATH;
process.env.LND_MACAROON_PATH = MOCK_MACAROON_PATH;
process.env.USE_MOCK_LND = 'true';

/**
 * Validate JSON string and log detailed error information if invalid
 */
function validateJson(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    logger.error(`Invalid JSON: ${error.message}`);

    // Log the problematic character and its position
    if (error.message.includes('position')) {
      const position = parseInt(error.message.match(/position (\d+)/)[1]);
      const problematicChar = jsonString.charAt(position);
      const context = jsonString.substring(
        Math.max(0, position - 20),
        Math.min(jsonString.length, position + 20)
      );
      logger.error(
        `Character at position ${position}: '${problematicChar}' (charCode: ${jsonString.charCodeAt(
          position
        )})`
      );
      logger.error(`Context: ...${context}...`);
    }

    return false;
  }
}

// Create a simple MCP server that directly handles the protocol
class SimpleMcpServer {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    this.requestCount = 0;
    this.rl.on('line', (line) => this.handleRequest(line));

    // Set up connection event handlers
    process.on('SIGHUP', () => {
      logger.info('Received SIGHUP signal - client may have disconnected');
    });

    process.stdin.on('end', () => {
      logger.info('stdin ended - client disconnected');
      this.close();
    });

    logger.info('Simple MCP server initialized');
  }

  handleRequest(line) {
    this.requestCount++;
    const requestId = this.requestCount;

    if (DEBUG) {
      logger.info(`[${requestId}] Received request: ${line}`);
    }

    try {
      // Validate the request JSON
      if (!validateJson(line)) {
        logger.error(`[${requestId}] Invalid JSON in request`);
        this.sendError(null, -32700, 'Parse error - invalid JSON', requestId);
        return;
      }

      const request = JSON.parse(line);

      if (DEBUG) {
        logger.info(`[${requestId}] Parsed request: ${JSON.stringify(request)}`);
      }

      if (!request.jsonrpc || request.jsonrpc !== '2.0') {
        logger.warn(`[${requestId}] Invalid JSON-RPC version: ${request.jsonrpc}`);
        this.sendError(request.id, -32600, 'Invalid Request - expected jsonrpc: "2.0"', requestId);
        return;
      }

      switch (request.method) {
        case 'initialize':
          logger.info(`[${requestId}] Handling initialize request`);
          {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                protocolVersion: request.params.protocolVersion || '2024-11-05',
                serverInfo: {
                  name: 'lnd-mcp-server-mock',
                  version: '1.0.0',
                },
                capabilities: {
                  sampling: {},
                  roots: {
                    listChanged: true,
                  },
                  tools: {},
                },
              },
            };
            this.sendResponse(response, requestId);
          }
          break;
        case 'notifications/initialized':
          logger.info(`[${requestId}] Handling notifications/initialized`);
          // No response needed for notifications
          break;
        case 'tools/list': // Support newer MCP protocol version naming scheme
        case 'listTools':
          logger.info(`[${requestId}] Handling listTools request`);
          this.handleListTools(request, requestId);
          break;
        case 'tools/call': // Support newer MCP protocol version naming scheme
        case 'callTool':
          logger.info(`[${requestId}] Handling callTool request for tool: ${request.params?.name}`);
          this.handleCallTool(request, requestId);
          break;
        default:
          logger.warn(`[${requestId}] Unknown method: ${request.method}`);
          this.sendError(request.id, -32601, `Method not found: ${request.method}`, requestId);
      }
    } catch (error) {
      logger.error(`[${requestId}] Error handling request: ${error.message}`);
      logger.error(error.stack);
      this.sendError(null, -32700, `Parse error: ${error.message}`, requestId);
    }
  }

  handleListTools(request, requestId) {
    if (DEBUG) {
      logger.info(`[${requestId}] Building listTools response`);
    }

    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: [
          {
            name: 'queryChannels',
            description: 'Query Lightning Network channels using natural language',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language query about channels',
                },
              },
              required: ['query'],
            },
            usage: {
              guidance: 'Ask questions about your Lightning Network channels in natural language',
              examples: [
                'Show me all my channels',
                'What is the health of my channels?',
                'How is my channel liquidity distributed?',
              ],
            },
          },
        ],
      },
    };

    this.sendResponse(response, requestId);
  }

  handleCallTool(request, requestId) {
    if (!request.params) {
      logger.error(`[${requestId}] Missing params in callTool request`);
      this.sendError(request.id, -32602, 'Missing params', requestId);
      return;
    }

    const { name, arguments: args } = request.params;

    if (name !== 'queryChannels') {
      logger.warn(`[${requestId}] Unknown tool requested: ${name}`);
      this.sendError(request.id, -32602, `Unknown tool: ${name}`, requestId);
      return;
    }

    // Debug logging to see exactly what's being received
    if (DEBUG) {
      logger.info(`[${requestId}] Received args: ${JSON.stringify(args)}`);
    }

    // Extract query
    let query = '';

    if (!args) {
      logger.error(`[${requestId}] Missing arguments in callTool request`, {
        component: 'mock-server',
        operation: 'handleCallTool',
        toolName: name,
      });
      this.sendError(request.id, -32602, 'Missing arguments', requestId);
      return;
    }

    // If args is a string, try to parse it as JSON
    if (typeof args === 'string') {
      try {
        const parsedArgs = JSON.parse(args);
        if (parsedArgs && typeof parsedArgs.query === 'string') {
          query = parsedArgs.query;
        }
      } catch (e) {
        logger.warn(`[${requestId}] Error parsing JSON args: ${e.message}`);
        // If parsing fails, use the string as is
        query = args;
      }
    }
    // If args is an object with a query property
    else if (typeof args === 'object' && args !== null) {
      if (typeof args.query === 'string') {
        query = args.query;
      }
    }

    if (!query) {
      logger.warn(`[${requestId}] Could not extract a valid query from: ${JSON.stringify(args)}`);
      this.sendError(request.id, -32602, 'Missing or invalid query parameter', requestId);
      return;
    }

    // Mock response based on query
    let response = '';
    let data = {};

    if (query.match(/list|show|what channels/i)) {
      response =
        'Your node has 5 channels with a total capacity of 0.05000000 BTC (5,000,000 sats). 4 channels are active and 1 is inactive.\n\nYour largest channels:\n1. ACINQ: 0.02000000 BTC (2,000,000 sats) (active)\n2. Bitrefill: 0.01000000 BTC (1,000,000 sats) (active)\n3. LightningTipBot: 0.00800000 BTC (800,000 sats) (active)\n4. Wallet of Satoshi: 0.00700000 BTC (700,000 sats) (active)\n5. LN+: 0.00500000 BTC (500,000 sats) (inactive)';
      data = {
        channels: [
          {
            capacity: 2000000,
            local_balance: 1000000,
            remote_balance: 1000000,
            channel_point: 'txid:0',
            active: true,
            remote_pubkey: '03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f',
            remote_alias: 'ACINQ',
          },
          // More channels...
        ],
        summary: {
          totalCapacity: 5000000,
          totalLocalBalance: 2500000,
          totalRemoteBalance: 2500000,
          activeChannels: 4,
          inactiveChannels: 1,
          averageCapacity: 1000000,
          healthyChannels: 4,
          unhealthyChannels: 1,
        },
      };
    } else if (query.match(/health|status|inactive|problematic/i)) {
      response =
        'Channel Health Summary: 4 healthy, 1 needs attention.\n\nYou have 1 inactive channel that needs attention:\n1. LN+: 0.00500000 BTC (500,000 sats)\n';
      data = {
        channels: [
          // Channel data...
        ],
        summary: {
          healthyChannels: 4,
          unhealthyChannels: 1,
          activeChannels: 4,
          inactiveChannels: 1,
        },
      };
    } else if (query.match(/liquidity|balance|imbalanced/i)) {
      response =
        'Liquidity Distribution: 0.02500000 BTC (2,500,000 sats) local (50%), 0.02500000 BTC (2,500,000 sats) remote (50%).\n\nYour most balanced channels:\n1. ACINQ: 50% local / 50% remote\n2. Bitrefill: 50% local / 50% remote\n3. LightningTipBot: 50% local / 50% remote\n\nYour most imbalanced channels:\n1. Wallet of Satoshi: 30% local / 70% remote\n';
      data = {
        channels: [
          // Channel data...
        ],
        summary: {
          totalLocalBalance: 2500000,
          totalRemoteBalance: 2500000,
          totalCapacity: 5000000,
        },
      };
    } else {
      response = `I'm sorry, I don't understand how to answer: "${query}"`;
    }

    const mcpResponse = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [
          {
            type: 'text',
            text: response,
          },
          {
            type: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      },
    };

    this.sendResponse(mcpResponse, requestId);
  }

  sendResponse(response, requestId) {
    try {
      // Use JSON.stringify to ensure valid JSON
      const jsonString = JSON.stringify(response);

      if (DEBUG) {
        logger.info(`[${requestId}] Sending response: ${jsonString}`);
      }

      // Important: Use console.log for the actual response
      console.log(jsonString);
    } catch (error) {
      logger.error(`[${requestId}] Error sending response: ${error.message}`);
      logger.error(error.stack);

      // Try to send a simplified error response
      try {
        console.log(
          JSON.stringify({
            jsonrpc: '2.0',
            id: response.id || null,
            error: {
              code: -32603,
              message: 'Internal error while sending response',
            },
          })
        );
      } catch (e) {
        logger.error(`[${requestId}] Failed to send error response: ${e.message}`);
      }
    }
  }

  sendError(id, code, message, requestId) {
    try {
      // Use JSON.stringify to ensure valid JSON
      const errorResponse = {
        jsonrpc: '2.0',
        id: id || null,
        error: {
          code: code,
          message: message,
        },
      };

      const jsonString = JSON.stringify(errorResponse);

      if (DEBUG) {
        logger.warn(`[${requestId}] Sending error response: ${jsonString}`);
      }

      // Important: Use console.log for the actual response
      console.log(jsonString);
    } catch (e) {
      logger.error(`[${requestId}] Error sending error response: ${e.message}`);
      logger.error(e.stack);

      // Try to send a very basic error response
      try {
        console.log(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: 'Internal error',
            },
          })
        );
      } catch (err) {
        logger.error(`[${requestId}] Failed to send basic error response: ${err.message}`);
      }
    }
  }

  close() {
    this.rl.close();
    logger.info('Simple MCP server closed');
  }
}

/**
 * Run the mock server
 */
async function runMockServer() {
  try {
    logger.info('Starting Simple MCP server with mocked LND connection');

    // Create and start simple MCP server
    const server = new SimpleMcpServer();

    logger.info('Simple MCP Server started');
    logger.info('Press Ctrl+C to stop');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Stopping Simple MCP server');
      server.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error(
      `Error starting mock server: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Run the mock server
runMockServer();
