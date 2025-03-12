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

3. Copy the environment template and configure it:

   ```bash
   cp .env.template .env
   ```

4. Edit the `.env` file with your LND credentials

## LND Configuration

This server connects to your LND node to retrieve information. You'll need:

1. **TLS Certificate**: Typically located at `~/.lnd/tls.cert`
2. **Macaroon**: Use a readonly macaroon for security, typically at `~/.lnd/data/chain/bitcoin/mainnet/readonly.macaroon`
3. **Host and Port**: Default is `localhost:10009`

Update these values in your `.env` file:

```bash
LND_TLS_CERT_PATH=/path/to/your/tls.cert
LND_MACAROON_PATH=/path/to/your/readonly.macaroon
LND_HOST=localhost
LND_PORT=10009
```

## Running the Server

Start the development server:

```bash
npm run dev
```

Or build and run the production version:

```bash
npm run build
npm start
```

Or use the MCP server runner:

```bash
npm run mcp
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
node scripts/mock-server.js
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

## License

[MIT](./LICENSE)
