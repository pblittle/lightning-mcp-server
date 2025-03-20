#!/usr/bin/env node

/**
 * Test script for listing channels from the real LND MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

// Run the query script with the list query
const queryProcess = spawn(
  'node',
  [path.resolve(__dirname, 'query.js'), 'Show me all my channels'],
  {
    stdio: 'inherit',
  }
);

// Handle process events
queryProcess.on('error', (error) => {
  console.error('Error running query:', error);
  process.exit(1);
});

queryProcess.on('exit', (code) => {
  process.exit(code);
});
