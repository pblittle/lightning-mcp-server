#!/usr/bin/env node

/**
 * Test script for querying channel health from the real MCP-LND server
 */

const { spawn } = require('child_process');
const path = require('path');

// Run the query script with the health query
const queryProcess = spawn(
  'node',
  [path.resolve(__dirname, 'query.js'), 'What is the health of my channels?'],
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
