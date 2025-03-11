#!/usr/bin/env node

/**
 * Fixed MCP-LND Mock Server
 *
 * This script runs a simplified MCP server with a mocked LND connection for testing purposes.
 * It directly implements the MCP protocol without relying on the SDK.
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Debug flag - set to true for detailed logging
const DEBUG = true;

// Use a simple console logger instead of the actual logger
const logger = {
  info: (message) =>
    console.log(`[INFO] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
  warn: (message) =>
    console.warn(`[WARN] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
  error: (message) =>
    console.error(`[ERROR] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
  debug: (message) =>
    DEBUG &&
    console.log(`[DEBUG] ${typeof message === 'object' ? JSON.stringify(message) : message}`),
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
// These are not actually used by our mock server, but we set them
// to prevent any imported code from trying to use real LND credentials
process.env.LND_TLS_CERT_PATH = MOCK_CERT_PATH;
process.env.LND_MACAROON_PATH = MOCK_MACAROON_PATH;
process.env.USE_MOCK_LND = 'true'; // Signal to use mock responses

/**
 * Validate JSON string and log detailed error information if invalid
 * @param {string} jsonString JSON string to validate
 * @returns {boolean} True if valid JSON, false otherwise
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

      // Log nearby characters for more context
      let positionInfo = '';
      for (
        let i = Math.max(0, position - 5);
        i <= Math.min(jsonString.length - 1, position + 5);
        i++
      ) {
        const char = jsonString.charAt(i);
        positionInfo += `[${i}]:'${char}'(${jsonString.charCodeAt(i)}) `;
      }
      logger.error(`Nearby characters: ${positionInfo}`);
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
        this.sendError(null, -32700, 'Parse error - invalid JSON');
        return;
      }

      const request = JSON.parse(line);

      if (DEBUG) {
        logger.info(`[${requestId}] Parsed request: ${JSON.stringify(request)}`);
      }

      if (!request.jsonrpc || request.jsonrpc !== '2.0') {
        logger.warn(`[${requestId}] Invalid JSON-RPC version: ${request.jsonrpc}`);
        this.sendError(request.id, -32600, 'Invalid Request - expected jsonrpc: "2.0"');
        return;
      }

      switch (request.method) {
        case 'listTools':
          logger.info(`[${requestId}] Handling listTools request`);
          this.handleListTools(request, requestId);
          break;
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
            name: 'executeLndCommand',
            description: 'Execute a safe LND command',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Name of the LND command to execute',
                },
                params: {
                  type: 'object',
                  description: 'Parameters for the command',
                },
              },
              required: ['command'],
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

    if (name !== 'executeLndCommand') {
      logger.warn(`[${requestId}] Unknown tool requested: ${name}`);
      this.sendError(request.id, -32602, `Unknown tool: ${name}`, requestId);
      return;
    }

    // Debug logging to see exactly what's being received
    if (DEBUG) {
      logger.info(`[${requestId}] Received args: ${JSON.stringify(args)}`);
    }

    // Extract command - handle different formats
    let commandName = '';
    let commandParams = {};

    if (!args) {
      logger.error(`[${requestId}] Missing arguments`);
      this.sendError(request.id, -32602, 'Missing arguments', requestId);
      return;
    }

    // If args is a string, try to parse it as JSON
    if (typeof args === 'string') {
      try {
        const parsedArgs = JSON.parse(args);
        if (parsedArgs && typeof parsedArgs.command === 'string') {
          commandName = parsedArgs.command;
          commandParams = parsedArgs.params || {};
        }
      } catch (e) {
        // If parsing fails, use the string as is
        commandName = args;
      }
    }
    // If args is an object with a command property
    else if (typeof args === 'object' && args !== null) {
      if (typeof args.command === 'string') {
        // Normal case: args.command is a string
        commandName = args.command;
        commandParams = args.params || {};
      }
      // If args.command is an object that might be a stringified JSON
      else if (typeof args.command === 'object' && args.command !== null) {
        if (args.command.command && typeof args.command.command === 'string') {
          commandName = args.command.command;
          commandParams = args.command.params || args.params || {};
        }
      }
    }

    // Remove any quotes that might be wrapping the command name
    if (commandName.startsWith('"') && commandName.endsWith('"')) {
      commandName = commandName.slice(1, -1);
    }

    // Try to parse the command if it looks like JSON
    if (commandName.startsWith('{') && commandName.endsWith('}')) {
      try {
        const parsedCommand = JSON.parse(commandName);
        if (parsedCommand && typeof parsedCommand.command === 'string') {
          commandName = parsedCommand.command;
          commandParams = parsedCommand.params || commandParams;
        }
      } catch (e) {
        // If parsing fails, keep the original command
        logger.warn(`[${requestId}] Failed to parse command as JSON: ${e.message}`);
      }
    }

    if (DEBUG) {
      logger.info(
        `[${requestId}] Extracted command: "${commandName}", params: ${JSON.stringify(
          commandParams
        )}`
      );
    }

    if (!commandName) {
      logger.warn(`[${requestId}] Could not extract a valid command from: ${JSON.stringify(args)}`);
      this.sendError(request.id, -32602, 'Missing or invalid command parameter', requestId);
      return;
    }

    // Check if command is allowed
    const allowedCommands = [
      'getWalletInfo',
      'getChainBalance',
      'getChannelBalance',
      'getChannels',
      'getPeers',
      'getNetworkInfo',
      'getClosedChannels',
      'getPendingChannels',
      'getInvoices',
      'getPayments',
      'decodePaymentRequest',
      'createInvoice',
      'payViaPaymentRequest',
    ];

    if (!allowedCommands.includes(commandName)) {
      logger.warn(`[${requestId}] Command not allowed: ${commandName}`);
      this.sendError(
        request.id,
        -32602,
        `Command '${commandName}' is not allowed. Allowed commands: ${allowedCommands.join(', ')}`,
        requestId
      );
      return;
    }

    // Mock response based on command
    let result;
    switch (commandName) {
      case 'getWalletInfo':
        result = {
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
        break;
      case 'getChainBalance':
        result = {
          confirmed_balance: 1000000,
          unconfirmed_balance: 50000,
        };
        break;
      case 'getChannelBalance':
        result = {
          channel_balance: 500000,
          pending_balance: 10000,
        };
        break;
      default:
        result = { message: `Mock response for ${commandName}` };
    }

    if (DEBUG) {
      logger.info(
        `[${requestId}] Generated mock result for ${commandName}: ${JSON.stringify(result)}`
      );
    }

    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      },
    };

    this.sendResponse(response, requestId);
  }

  sendResponse(response, requestId) {
    try {
      // Use JSON.stringify to ensure valid JSON
      const jsonString = JSON.stringify(response);

      if (DEBUG) {
        logger.info(`[${requestId}] Sending response: ${jsonString}`);

        // Validate JSON before sending
        try {
          JSON.parse(jsonString);
          logger.info(`[${requestId}] Response is valid JSON`);
        } catch (error) {
          logger.error(`[${requestId}] Response is NOT valid JSON: ${error.message}`);
        }
      }

      console.log(jsonString);
    } catch (error) {
      logger.error(`[${requestId}] Error sending response: ${error.message}`);
      logger.error(error.stack);

      // Try to send a simplified error response
      try {
        console.log(
          `{"jsonrpc":"2.0","id":"${
            response.id || 'null'
          }","error":{"code":-32603,"message":"Internal error while sending response"}}`
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

        // Validate JSON before sending
        try {
          JSON.parse(jsonString);
          logger.info(`[${requestId}] Error response is valid JSON`);
        } catch (error) {
          logger.error(`[${requestId}] Error response is NOT valid JSON: ${error.message}`);
        }
      }

      console.log(jsonString);
    } catch (e) {
      logger.error(`[${requestId}] Error sending error response: ${e.message}`);
      logger.error(e.stack);

      // Try to send a very basic error response
      try {
        console.log(
          '{"jsonrpc":"2.0","id":null,"error":{"code":-32603,"message":"Internal error"}}'
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
