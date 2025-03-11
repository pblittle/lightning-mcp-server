#!/usr/bin/env node

/**
 * MCP-LND Server Runner
 *
 * This script builds and runs the MCP-LND server.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const BUILD_DIR = path.join(__dirname, 'build');
const MAIN_FILE = path.join(BUILD_DIR, 'index.js');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Build the project
console.log('Building MCP-LND server...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Make the main file executable
try {
  fs.chmodSync(MAIN_FILE, '755');
  console.log(`Made ${MAIN_FILE} executable.`);
} catch (error) {
  console.warn(`Warning: Could not make ${MAIN_FILE} executable:`, error.message);
}

// Run the server
console.log('Starting MCP-LND server...');
try {
  execSync('node build/index.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Server execution failed:', error.message);
  process.exit(1);
}
