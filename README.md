# LND MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP)-compatible server for interacting with your [Lightning Network Daemon](https://docs.lightning.engineering/lightning-network-tools/lnd) (LND) node. This server provides a secure interface to execute LND commands through the Model Context Protocol, allowing AI assistants to safely interact with your Lightning Network node.

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

### Execute LND Command Tool

The MCP server provides a tool called `executeLndCommand` that allows executing safe LND commands through the Model Context Protocol. This tool validates commands against a whitelist and ensures parameters are valid.

By default, only read-only commands are allowed. To enable write commands (like creating invoices), set the `ALLOW_WRITE_COMMANDS` environment variable to `true` in your `.env` file:

```bash
ALLOW_WRITE_COMMANDS=true
```

#### Available Commands

The server supports a variety of LND commands, including:

- **Read-only commands**: `getWalletInfo`, `getChainBalance`, `getChannelBalance`, `getChannels`, `getPeers`, `getNetworkInfo`, `getClosedChannels`, `getPendingChannels`, `getInvoices`, `getPayments`, `decodePaymentRequest`
- **Write commands** (when enabled): `createInvoice`, `payViaPaymentRequest`

Each command is validated to ensure it's allowed and that all required parameters are provided.

## Testing

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
- Unit tests for balance and node information queries
- Mocked LND responses for deterministic testing

Tests use Jest and follow a consistent pattern of mocking external dependencies while testing the full integration between components. For more details on the testing strategy, see the [Architecture documentation](./ARCHITECTURE.md#4-testing-strategy).

### Testing with Mock LND Connection

You can run the MCP server with a mocked LND connection for testing purposes without needing a real LND node:

#### Standard Mock Server

```bash
npm run mcp:mock
```

This will:

1. Create mock TLS certificate and macaroon files in a `mock` directory
2. Start the MCP server with a mock LND client that returns predefined responses
3. Allow you to test the MCP server functionality without a real LND connection

#### Fixed Mock Server (for MCP Inspector)

If you're using the MCP Inspector to test the server, use the fixed mock server instead:

```bash
npm run mcp:fixed-mock
```

This version provides properly formatted JSON responses that are compatible with the MCP Inspector.

#### MCP Inspector Test

For a simplified testing experience with the MCP Inspector, use the provided test script:

```bash
npm run mcp:inspector-test
```

This script:

1. Launches the MCP Inspector with the fixed mock server
2. Provides instructions for testing in the terminal
3. Automatically connects the fixed mock server to the MCP Inspector

To use the MCP Inspector test:

1. Install the MCP Inspector if you haven't already:

   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Run the MCP Inspector test script:

   ```bash
   npm run mcp:inspector-test
   ```

3. Follow the instructions in the terminal to test the MCP server with the MCP Inspector

#### Manual MCP Inspector Setup

You can also manually set up the MCP Inspector:

1. Install the MCP Inspector if you haven't already:

   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Start the fixed mock server:

   ```bash
   npm run mcp:fixed-mock
   ```

3. In another terminal, run the MCP Inspector:

   ```bash
   mcp-inspector
   ```

4. In the MCP Inspector web interface:

   - Click "Connect" in the top right
   - Set the transport type to "stdio"
   - Set the command to the path to your fixed-mock-server.js file
   - Click "Connect"

5. Once connected, you can:
   - List available tools
   - Call the executeLndCommand tool with different commands
   - See the mock responses

These mock servers are useful for:

- Testing the MCP server in isolation
- Developing and testing LLM applications that use the MCP server
- Demonstrating the MCP server functionality without a real LND node

## License

[MIT](./LICENSE)
