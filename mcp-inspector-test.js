#!/usr/bin/env node

/**
 * MCP Inspector Test Script
 *
 * This script tests the MCP Inspector with our fixed mock server.
 * It launches the MCP Inspector with the fixed mock server and
 * provides instructions for testing.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the fixed mock server
const FIXED_MOCK_SERVER_PATH = path.resolve(__dirname, 'fixed-mock-server.js');

// Make sure the fixed mock server is executable
try {
  fs.chmodSync(FIXED_MOCK_SERVER_PATH, '755');
  console.log('Made fixed-mock-server.js executable');
} catch (error) {
  console.error('Error making fixed-mock-server.js executable:', error.message);
}

// Launch the MCP Inspector with the fixed mock server
console.log('Launching MCP Inspector with fixed mock server...');
console.log('Command: mcp-inspector --command', FIXED_MOCK_SERVER_PATH);

// Create environment variables string
const envVars = JSON.stringify({
  HOME: process.env.HOME,
  PATH: process.env.PATH,
  USER: process.env.USER,
  SHELL: process.env.SHELL,
  TERM: process.env.TERM,
  LOGNAME: process.env.LOGNAME,
});

const inspector = spawn('mcp-inspector', ['--command', FIXED_MOCK_SERVER_PATH, '--env', envVars], {
  stdio: 'inherit',
  shell: true,
});

inspector.on('error', (error) => {
  console.error('Error launching MCP Inspector:', error.message);
});

inspector.on('exit', (code) => {
  console.log('MCP Inspector exited with code:', code);
});

console.log('\nInstructions:');
console.log('1. Open the MCP Inspector in your browser at http://localhost:5173');
console.log('2. The fixed mock server should be automatically connected');
console.log('3. Try the following operations:');
console.log('   - Click "List Tools" to see available tools');
console.log('   - Click "executeLndCommand" to expand it');
console.log('   - Enter the following in the Arguments field:');
console.log('     {');
console.log('       "command": "getWalletInfo",');
console.log('       "params": {}');
console.log('     }');
console.log('   - Click "Call Tool" to execute the command');
console.log('4. Check the response for proper JSON formatting');
console.log('\nPress Ctrl+C to exit');
