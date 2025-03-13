#!/usr/bin/env node

/**
 * Run the MCP-LND Server
 *
 * This script runs the actual MCP server that connects to a real LND node.
 * It requires a proper .env file with LND connection details.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.test file if it exists, otherwise from .env
const envFile = fs.existsSync('.env.test') ? '.env.test' : '.env';
dotenv.config({ path: envFile });
console.log(`Using environment file: ${envFile}`);

// Check if required environment variables are set
const requiredVars = ['LND_TLS_CERT_PATH', 'LND_MACAROON_PATH'];
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please create a .env file based on .env.template with your LND node details.');
  process.exit(1);
}

// Check if the files exist
const tlsCertPath = process.env.LND_TLS_CERT_PATH;
const macaroonPath = process.env.LND_MACAROON_PATH;

if (!fs.existsSync(tlsCertPath)) {
  console.error(`Error: TLS certificate file not found at: ${tlsCertPath}`);
  process.exit(1);
}

if (!fs.existsSync(macaroonPath)) {
  console.error(`Error: Macaroon file not found at: ${macaroonPath}`);
  process.exit(1);
}

// Run the server
console.log('Starting MCP-LND server...');
console.log(`LND Host: ${process.env.LND_HOST || 'localhost'}`);
console.log(`LND Port: ${process.env.LND_PORT || '10009'}`);

// Use ts-node to run the TypeScript file directly
const serverProcess = spawn('npx', ['ts-node', path.resolve(__dirname, '../src/index.ts')], {
  stdio: 'inherit',
  env: process.env,
});

// Handle process events
serverProcess.on('error', (error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle signals to gracefully shut down
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  serverProcess.kill('SIGTERM');
});
