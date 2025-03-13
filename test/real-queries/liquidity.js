#!/usr/bin/env node

/**
 * Test script for querying channel liquidity from the real MCP-LND server
 */

const { spawn } = require('child_process');
const path = require('path');

// Run the query script with the liquidity query
const queryProcess = spawn(
  'node',
  [path.resolve(__dirname, 'query.js'), 'How is my channel liquidity distributed?'],
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
