#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Spawn the MCP server process
const serverProcess = spawn('node', [path.resolve(process.cwd(), 'mock-server.js')]);

// Send a JSON-RPC request to query channels
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'callTool',
  params: {
    name: 'queryChannels',
    arguments: {
      query: 'How is my channel liquidity distributed?'
    }
  }
};

// Write the request to the server's stdin
serverProcess.stdin.write(JSON.stringify(request) + '\n');

// Listen for responses on stdout
serverProcess.stdout.on('data', (data) => {
  console.log('\nResponse from server:');
  console.log('-'.repeat(50));
  
  try {
    const response = JSON.parse(data.toString());
    
    // Extract and display the text content
    if (response.result && response.result.content) {
      const textContent = response.result.content.find(item => item.type === 'text');
      if (textContent) {
        console.log(textContent.text);
      }
      
      console.log('\nJSON Data:');
      console.log('-'.repeat(50));
      const jsonContent = response.result.content.find(item => item.type === 'application/json');
      if (jsonContent) {
        console.log(JSON.parse(jsonContent.text));
      }
    } else {
      console.log(response);
    }
  } catch (error) {
    console.log('Raw response:', data.toString());
  }
  
  // Exit after receiving the response
  setTimeout(() => {
    serverProcess.kill();
    process.exit(0);
  }, 100);
});

// Handle errors
serverProcess.stderr.on('data', (data) => {
  // Filter out the debug logs to keep output clean
  const logLine = data.toString();
  if (!logLine.includes('[DEBUG]') && !logLine.includes('[INFO]')) {
    console.error('Server error:', logLine);
  }
});

serverProcess.on('error', (error) => {
  console.error('Error spawning server:', error);
});

console.log('Sending query: "How is my channel liquidity distributed?"');
console.log('Waiting for response...');
