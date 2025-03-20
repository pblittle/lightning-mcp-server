#!/usr/bin/env node

/**
 * Test script for querying the real LND MCP server
 *
 * Usage: node test/real-queries/query.js "Your natural language query here"
 *
 * Example: node test/real-queries/query.js "Show me all my channels"
 */

const net = require('net');
const readline = require('readline');

// Get the query from command line arguments
const query = process.argv.slice(2).join(' ');

if (!query) {
  console.error('Error: No query provided');
  console.error('Usage: node test/real-queries/query.js "Your natural language query here"');
  process.exit(1);
}

// Load environment variables from .env.test file if it exists, otherwise from .env
const dotenv = require('dotenv');
const fs = require('fs');
const envFile = fs.existsSync('.env.test') ? '.env.test' : '.env';
dotenv.config({ path: envFile });

// Connect to the MCP server
const client = new net.Socket();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

console.log(`Connecting to MCP server at ${HOST}:${PORT}...`);
console.log(`Query: "${query}"`);

client.connect(PORT, HOST, () => {
  console.log('Connected to server');

  // Create a JSON-RPC request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'callTool',
    params: {
      name: 'queryChannels',
      arguments: {
        query: query,
      },
    },
  };

  // Send the request
  client.write(JSON.stringify(request) + '\n');
  console.log('Request sent, waiting for response...');
});

// Set up a readline interface to parse line-by-line responses
const rl = readline.createInterface({
  input: client,
  crlfDelay: Infinity,
});

// Handle responses
rl.on('line', (line) => {
  try {
    console.log('\nResponse from server:');
    console.log('-'.repeat(50));

    const response = JSON.parse(line);

    // Extract and display the text content
    if (response.result && response.result.content) {
      const textContent = response.result.content.find((item) => item.type === 'text');
      if (textContent) {
        console.log(textContent.text);
      }

      console.log('\nJSON Data:');
      console.log('-'.repeat(50));
      const jsonContent = response.result.content.find((item) => item.type === 'application/json');
      if (jsonContent) {
        console.log(JSON.parse(jsonContent.text));
      }
    } else if (response.error) {
      console.error('Error:', response.error.message);
    } else {
      console.log(response);
    }

    // Close the connection after receiving the response
    client.end();
  } catch (error) {
    console.error('Error parsing response:', error.message);
    console.log('Raw response:', line);
    client.end();
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('Connection error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('\nMake sure the server is running:');
    console.error('1. Create a .env file with your LND node details (see .env.template)');
    console.error('2. Start the server with: node scripts/run-server.js');
  }
  process.exit(1);
});

// Handle connection close
client.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

// Handle timeout
client.setTimeout(10000);
client.on('timeout', () => {
  console.error('Connection timed out');
  client.end();
  process.exit(1);
});
