#!/usr/bin/env node

/**
 * MCP-LND Server Runner
 *
 * This script builds and runs the MCP-LND server.
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

// Configuration
const BUILD_DIR = path.join(__dirname, 'dist');
const MAIN_FILE = path.join(BUILD_DIR, 'index.js');

// Get NODE_ENV from environment or use default
const nodeEnv = process.env.NODE_ENV || 'development';

console.log(`Running in ${nodeEnv} environment`);

// Create build directory if it doesn't exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Build the TypeScript code
console.log('Building MCP-LND server...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Make the main file executable (for Unix systems)
try {
  fs.chmodSync(MAIN_FILE, '755');
  console.log(`Made ${MAIN_FILE} executable.`);
} catch (error) {
  console.warn(`Warning: Could not make ${MAIN_FILE} executable: ${error.message}`);
}

// Run the server with NODE_ENV set
console.log(`Starting MCP-LND server in ${nodeEnv} mode...`);
try {
  const serverProcess = spawn('node', [MAIN_FILE], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: nodeEnv },
  });

  // Handle process events
  serverProcess.on('error', (error) => {
    console.error('Server execution failed:', error.message);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle parent process termination
  process.on('SIGINT', () => {
    console.log('Received SIGINT signal, shutting down...');
    serverProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal, shutting down...');
    serverProcess.kill('SIGTERM');
  });
} catch (error) {
  console.error('Server execution failed:', error.message);
  process.exit(1);
}
