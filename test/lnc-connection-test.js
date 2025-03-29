#!/usr/bin/env node

/**
 * Lightning Node Connect (LNC) Connection Test
 *
 * This script tests the connection to a Lightning Network node via LNC.
 * It verifies that the connection can be established and basic node
 * information can be retrieved.
 *
 * Usage:
 *   node test/lnc-connection-test.js
 *
 * Environment variables:
 *   LNC_CONNECTION_STRING - The LNC connection string
 *   LNC_PAIRING_PHRASE - Optional pairing phrase for initial connection
 */

// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const { LncClient } = require('../dist/infrastructure/lnc/LncClient');
const { LncGateway } = require('../dist/infrastructure/lnc/LncGateway');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Print a colored message to the console
 * @param {string} message - The message to print
 * @param {string} color - The color to use
 */
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Print a section header
 * @param {string} title - The section title
 */
function section(title) {
  console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.cyan + ' ' + title + colors.reset);
  console.log(colors.cyan + '='.repeat(80) + colors.reset);
}

/**
 * Print a success message
 * @param {string} message - The success message
 */
function success(message) {
  log(`✓ ${message}`, colors.green);
}

/**
 * Print an error message
 * @param {string} message - The error message
 */
function error(message) {
  log(`✗ ${message}`, colors.red);
}

/**
 * Print a warning message
 * @param {string} message - The warning message
 */
function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * Print an info message
 * @param {string} message - The info message
 */
function info(message) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Test the LNC connection
 */
async function testLncConnection() {
  section('Lightning Node Connect (LNC) Connection Test');

  // Check for required environment variables
  const connectionString = process.env.LNC_CONNECTION_STRING;
  const pairingPhrase = process.env.LNC_PAIRING_PHRASE;

  if (!connectionString) {
    error('LNC_CONNECTION_STRING environment variable is not set');
    info('Please set the LNC_CONNECTION_STRING environment variable in your .env file');
    process.exit(1);
  }

  info(`Connection string length: ${connectionString.length} characters`);
  if (pairingPhrase) {
    info('Pairing phrase is set');
  } else {
    warning('Pairing phrase is not set (only required for initial pairing)');
  }

  // Create the LNC client
  let client;
  try {
    info('Creating LNC client...');
    client = new LncClient({
      connectionString,
      pairingPhrase,
    });
    success('LNC client created successfully');
  } catch (err) {
    error(`Failed to create LNC client: ${err.message}`);
    process.exit(1);
  }

  // Test the connection
  try {
    info('Testing connection...');
    const connected = await client.checkConnection();
    if (connected) {
      success('Connection successful');
    } else {
      error('Connection check returned false');
      process.exit(1);
    }
  } catch (err) {
    error(`Connection test failed: ${err.message}`);
    process.exit(1);
  }

  // Get node info
  try {
    info('Fetching node info...');
    const nodeInfo = await client.getNodeInfo();
    success('Node info retrieved successfully');
    console.log('\nNode Information:');
    console.log('----------------');
    console.log(`Alias: ${nodeInfo.alias}`);
    console.log(`Pubkey: ${nodeInfo.pubkey.substring(0, 10)}...`);
    console.log(`Active Channels: ${nodeInfo.activeChannelsCount}`);
    console.log(`Pending Channels: ${nodeInfo.pendingChannelsCount}`);
    console.log(`Peers: ${nodeInfo.peersCount}`);
  } catch (err) {
    error(`Failed to get node info: ${err.message}`);
    process.exit(1);
  }

  // Create the LNC gateway
  let gateway;
  try {
    info('Creating LNC gateway...');
    gateway = new LncGateway(client);
    success('LNC gateway created successfully');
  } catch (err) {
    error(`Failed to create LNC gateway: ${err.message}`);
    process.exit(1);
  }

  // Get channels
  try {
    info('Fetching channels...');
    const channels = await gateway.getChannels();
    success(`Retrieved ${channels.length} channels`);

    if (channels.length > 0) {
      console.log('\nChannel Summary:');
      console.log('---------------');

      // Calculate total capacity and balances
      const totalCapacity = channels.reduce((sum, channel) => sum + channel.capacity, 0);
      const totalLocalBalance = channels.reduce((sum, channel) => sum + channel.local_balance, 0);
      const totalRemoteBalance = channels.reduce((sum, channel) => sum + channel.remote_balance, 0);

      console.log(`Total Capacity: ${totalCapacity} sats`);
      console.log(`Total Local Balance: ${totalLocalBalance} sats`);
      console.log(`Total Remote Balance: ${totalRemoteBalance} sats`);
      console.log(`Active Channels: ${channels.filter((c) => c.active).length}`);
      console.log(`Inactive Channels: ${channels.filter((c) => !c.active).length}`);
    }
  } catch (err) {
    error(`Failed to get channels: ${err.message}`);
    // Continue with the test, this is not a critical failure
  }

  // Close the connection
  try {
    info('Closing connection...');
    client.close();
    success('Connection closed successfully');
  } catch (err) {
    warning(`Error closing connection: ${err.message}`);
  }

  section('Test Complete');
  success('LNC connection test completed successfully');
}

// Run the test
testLncConnection().catch((err) => {
  error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
