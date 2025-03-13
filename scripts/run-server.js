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

/**
 * Sanitize error messages to remove sensitive information
 * @param {string} message - The error message to sanitize
 * @returns {string} - The sanitized message
 */
function sanitizeErrorMessage(message) {
  if (!message) {
    return message;
  }

  // Redact certificate paths
  let sanitized = message.replace(/\/[^\s\/]+\/[^\s\/]*cert[^\s\/]*/gi, '[REDACTED_CERT_PATH]');
  sanitized = sanitized.replace(
    /[a-zA-Z]:\\[^\s\\]+\\[^\s\\]*cert[^\s\\]*/gi,
    '[REDACTED_CERT_PATH]'
  );

  // Redact macaroon paths
  sanitized = sanitized.replace(
    /\/[^\s\/]+\/[^\s\/]*macaroon[^\s\/]*/gi,
    '[REDACTED_MACAROON_PATH]'
  );
  sanitized = sanitized.replace(
    /[a-zA-Z]:\\[^\s\\]+\\[^\s\\]*macaroon[^\s\\]*/gi,
    '[REDACTED_MACAROON_PATH]'
  );

  // Redact key paths
  sanitized = sanitized.replace(/\/[^\s\/]+\/[^\s\/]*key[^\s\/]*/gi, '[REDACTED_KEY_PATH]');
  sanitized = sanitized.replace(
    /[a-zA-Z]:\\[^\s\\]+\\[^\s\\]*key[^\s\\]*/gi,
    '[REDACTED_KEY_PATH]'
  );

  // Redact credential paths
  sanitized = sanitized.replace(
    /\/[^\s\/]+\/[^\s\/]*(?:secret|token|password|credential)[^\s\/]*/gi,
    '[REDACTED_CREDENTIAL]'
  );
  sanitized = sanitized.replace(
    /[a-zA-Z]:\\[^\s\\]+\\[^\s\\]*(?:secret|token|password|credential)[^\s\\]*/gi,
    '[REDACTED_CREDENTIAL]'
  );

  // Redact environment variables
  sanitized = sanitized.replace(/(?:LND_TLS_CERT_PATH|CERT_PATH)=[^\s]+/gi, '[REDACTED_CERT_PATH]');
  sanitized = sanitized.replace(
    /(?:LND_MACAROON_PATH|MACAROON_PATH)=[^\s]+/gi,
    '[REDACTED_MACAROON_PATH]'
  );
  sanitized = sanitized.replace(/(?:KEY_PATH)=[^\s]+/gi, '[REDACTED_KEY_PATH]');
  sanitized = sanitized.replace(
    /(?:SECRET|TOKEN|PASSWORD|CREDENTIAL)=[^\s]+/gi,
    '[REDACTED_CREDENTIAL]'
  );

  // Redact generic file paths
  sanitized = sanitized.replace(/\/[^\s\/]+\/[^\s\/]+\.[a-zA-Z0-9]+/g, '[REDACTED_PATH]');
  sanitized = sanitized.replace(/[a-zA-Z]:\\[^\s\\]+\\[^\s\\]+\.[a-zA-Z0-9]+/g, '[REDACTED_PATH]');

  return sanitized;
}

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
  console.error(`Error: TLS certificate file not found at: [REDACTED_CERT_PATH]`);
  process.exit(1);
}

if (!fs.existsSync(macaroonPath)) {
  console.error(`Error: Macaroon file not found at: [REDACTED_MACAROON_PATH]`);
  process.exit(1);
}

// Run the server
console.log('Starting MCP-LND server...');
// Avoid logging potentially sensitive connection details
console.log('LND connection configured');

// Use ts-node to run the TypeScript file directly
const serverProcess = spawn('npx', ['ts-node', path.resolve(__dirname, '../src/index.ts')], {
  stdio: 'inherit',
  env: process.env,
});

// Handle process events
serverProcess.on('error', (error) => {
  console.error('Error starting server:', sanitizeErrorMessage(error.message));
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
