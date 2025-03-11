#!/usr/bin/env node

/**
 * MCP Test Script
 *
 * This script tests the MCP server by sending a simple request and logging the response.
 */

const { spawn } = require('child_process');
const path = require('path');

// Path to the mock server
const MOCK_SERVER_PATH = path.resolve(__dirname, 'fixed-mock-server.js');

// Create a child process for the mock server
const mockServer = spawn('node', [MOCK_SERVER_PATH], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

// Log server output
mockServer.stdout.on('data', (data) => {
  console.log(`Server stdout: ${data}`);
});

mockServer.stderr.on('data', (data) => {
  console.error(`Server stderr: ${data}`);
});

// Wait for the server to start
setTimeout(() => {
  console.log('Sending test request to server...');

  // First send a listTools request
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: '1',
    method: 'listTools',
    params: {},
  };

  console.log('Sending listTools request...');
  mockServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Wait a bit and then send a callTool request
  setTimeout(() => {
    const callToolRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'callTool',
      params: {
        name: 'executeLndCommand',
        arguments: {
          command: 'getWalletInfo',
          params: {},
        },
      },
    };

    console.log('Sending callTool request for getWalletInfo...');
    mockServer.stdin.write(JSON.stringify(callToolRequest) + '\n');

    // Wait for response and then exit
    setTimeout(() => {
      console.log('Test complete. Exiting...');
      mockServer.kill();
      process.exit(0);
    }, 2000);
  }, 2000);
}, 2000);

// Handle process exit
process.on('SIGINT', () => {
  mockServer.kill();
  process.exit(0);
});
