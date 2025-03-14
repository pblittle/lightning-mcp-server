# LND MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP)-compatible server for interacting with your [Lightning Network Daemon](https://docs.lightning.engineering/lightning-network-tools/lnd) (LND) node. This server provides a natural language interface to query your LND node through the Model Context Protocol, allowing AI assistants to safely interact with your node data.

This MCP server can be used with any LLM application that supports the Model Context Protocol, including Block Goose, Claude, and OpenAI-based applications.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Access to an LND node (local or remote)

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment (see [Environment Management](#environment-management) below)
4. Build the project:

   ```bash
   npm run build
   ```

## Environment Management

This project uses a clean, flexible environment management system that allows both standardized environment configurations and developer-specific customizations.

### Environment Files

The system uses a cascading hierarchy of environment files:

1. `.env.[environment].local` - Not committed, developer-specific overrides
2. `.env.[environment]` - Committed, shared environment-specific settings
3. `.env.local` - Not committed, shared local settings
4. `.env` - Committed, default settings

Files higher in the list take precedence over those lower in the list.

### Environment Types

The application supports these environment types:

- `development` - For local development
- `test` - For automated testing
- `production` - For production use

### Usage

Simply set the `NODE_ENV` environment variable to switch between environments:

```bash
# Development mode
NODE_ENV=development npm run mcp

# Test mode
NODE_ENV=test npm run mcp

# Production mode
NODE_ENV=production npm run mcp
```

Or use the convenience scripts:

```bash
# Development mode
npm run mcp:dev

# Test mode
npm run mcp:test

# Production mode
npm run mcp:prod
```

### Local Overrides

For developer-specific settings (like paths to your specific LND node):

1. Create a file named `.env.[environment].local`
2. Add your custom settings
3. This file won't be committed to Git

Example `.env.development.local`:

```bash
# My custom LND settings
LND_TLS_CERT_PATH=/Users/myname/.lnd/tls.cert
LND_MACAROON_PATH=/Users/myname/.lnd/data/chain/bitcoin/mainnet/readonly.macaroon
```

### Mock LND Mode

Set `USE_MOCK_LND=true` in any environment file to use a mock LND setup. This is useful for development and testing without a real LND node.

## LND Configuration

This server connects to your LND node to retrieve information. You'll need:

1. **TLS Certificate**: Typically located at `~/.lnd/tls.cert`
2. **Macaroon**: Use a readonly macaroon for security, typically at `~/.lnd/data/chain/bitcoin/mainnet/readonly.macaroon`
3. **Host and Port**: Default is `localhost:10009`

These values can be set in your environment files as described above.

## Running the Server

Start the server in development mode (with mock LND):

```bash
npm run mcp:dev
```

For production use with a real LND node:

```bash
npm run mcp:prod
```

## MCP Server Features

### Natural Language LND Queries

The MCP server provides a powerful natural language query interface for your LND node. This allows you to interact with your node using simple, conversational language instead of remembering specific commands and parameters.

#### Currently Supported: Channel Queries

The first implementation focuses on comprehensive channel queries:

- "Show me all my channels"
- "What's the health of my channels?"
- "How is my channel liquidity distributed?"

These queries provide detailed information about your channels, including capacity, balance, status, health analysis, and liquidity distribution.

#### Future Expansions

The architecture is designed for easy expansion to include:

- **Node queries**: Information about connected nodes, network position, etc.
- **Transaction queries**: Payment history, routing information, fee analysis
- **Network queries**: Network graph insights, route planning, path discovery

#### Benefits

- **Intuitive**: No need to remember specific command syntax
- **Contextual**: Responses are formatted in an easy-to-understand way
- **Comprehensive**: Get detailed information with simple queries
- **Flexible**: Multiple ways to ask for the same information
- **Expandable**: Architecture designed to add more query capabilities

## Testing

### Channel Query Tests

Test the natural language channel query functionality:

```bash
# Start the mock server
node scripts/mock-server.js

# In another terminal, run the test scripts
node test/channel-queries/list.js
node test/channel-queries/health.js
node test/channel-queries/liquidity.js
```

Each test script demonstrates a different type of natural language query:

1. **Channel List**: Shows all channels with capacity and status
2. **Channel Health**: Identifies inactive or problematic channels
3. **Liquidity Distribution**: Shows the balance between local and remote liquidity

### Automated Tests

Run the test suite:

```bash
npm test
```

Or use the Makefile:

```bash
make test
```

The test suite includes:

- Unit tests for LND client connection
- Unit tests for natural language processing and query handling
- Mocked LND responses for deterministic testing

Tests use Jest and follow a consistent pattern of mocking external dependencies while testing the full integration between components. For more details on the testing strategy, see the [Architecture documentation](./ARCHITECTURE.md#4-testing-strategy).

### Testing with Mock Server

You can run the MCP server with a mocked LND connection for testing purposes without needing a real LND node:

```bash
npm run mcp:mock
```

This will:

1. Create mock TLS certificate and macaroon files in a `mock` directory
2. Start the MCP server with a mock LND client that returns predefined responses
3. Allow you to test the natural language queries without a real LND connection

#### MCP Inspector Testing

For a simplified testing experience with the MCP Inspector, you can:

1. Install the MCP Inspector if you haven't already:

   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Start the mock server:

   ```bash
   node scripts/mock-server.js
   ```

3. In another terminal, run the MCP Inspector:

   ```bash
   npx @modelcontextprotocol/inspector
   ```

4. In the MCP Inspector web interface:

   - Click "Connect" in the top right
   - Set the transport type to "stdio"
   - Set the command to the path to your `scripts/mock-server.js` file
   - Click "Connect"

5. Once connected, you can:
   - List available tools
   - Try natural language queries
   - See the human-friendly responses and structured data

The mock server is useful for:

- Testing the natural language query functionality in isolation
- Developing and testing LLM applications that use the MCP server
- Demonstrating the capabilities without a real LND node

## Development

To set up a development environment:

1. Create a `.env.development.local` file with your specific settings, or use the mock LND setup
2. Run the development server:

   ```bash
   npm run dev
   ```

This will start the TypeScript server with hot reloading.

## Project Scripts

- `npm run build` - Build the TypeScript project
- `npm run start` - Run the built application
- `npm run dev` - Run in development mode with hot reloading
- `npm test` - Run the test suite
- `npm run lint` - Run the linter
- `npm run format` - Format code with Prettier
- `npm run validate` - Run all validation (lint, format check, type check)
- `npm run mcp` - Run the MCP server
- `npm run mcp:dev` - Run the MCP server in development mode
- `npm run mcp:test` - Run the MCP server in test mode
- `npm run mcp:prod` - Run the MCP server in production mode
- `npm run mcp:mock` - Run the MCP server with a mock LND node
- `npm run mcp:fixed-mock` - Run a simplified mock MCP server
- `npm run mcp:inspector-test` - Run a test for the MCP Inspector

## License

[MIT](./LICENSE)
