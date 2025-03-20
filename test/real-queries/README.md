# Testing with a Real LND Node

This directory contains scripts for testing the LND MCP server with a real Lightning Network node.

## Prerequisites

1. A running LND node
2. TLS certificate and macaroon files for authentication
3. A `.env` file with the proper configuration

## Setup

1. Create a `.env.test` file in the project root based on `.env.test.template`:

```
# Test Environment Configuration

# LND Configuration
LND_TLS_CERT_PATH=/path/to/your/test/tls.cert
LND_MACAROON_PATH=/path/to/your/test/readonly.macaroon
LND_HOST=localhost
LND_PORT=10009

# Server Configuration
PORT=3001  # Using a different port for testing
```

Replace the paths with the actual paths to your TLS certificate and macaroon files. Using a separate test environment file allows you to keep your development and test configurations separate.

## Running the Tests

### 1. Start the Server

First, start the MCP-LND server:

```bash
node scripts/run-server.js
```

This will start the server and connect to your LND node using the configuration from your `.env.test` file (or `.env` if `.env.test` doesn't exist).

### 2. Run the Tests

In a separate terminal, run one of the test scripts:

```bash
# List all channels
node test/real-queries/list.js

# Check channel health
node test/real-queries/health.js

# Check channel liquidity
node test/real-queries/liquidity.js

# Run a custom query
node test/real-queries/query.js "Your custom query here"
```

## Troubleshooting

If you encounter any issues:

1. Make sure your LND node is running and accessible
2. Check that your TLS certificate and macaroon paths are correct
3. Ensure your macaroon has the necessary permissions (at least read-only)
4. Check the server logs for any error messages
