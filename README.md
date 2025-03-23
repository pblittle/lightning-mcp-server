# LND MCP Server

An MCP server that connects to your Lightning Network node and enables natural language queries for channel information.

> **Note:** The current version focuses on channel data. Additional LND data types will be added in future releases.

## What is it?

LND MCP Server connects your Lightning Network node to LLM applications through the Model Context Protocol. Ask questions in natural language and get human-readable responses alongside structured JSON data.

## Features

- Query LND node data using natural language
- Strong data validation and type safety with Zod schema validation
- Secure connection via TLS certificates and macaroons
- Mock LND mode for development without a real node
- MCP protocol compliant responses for LLM integration
- Compatible with any MCP-supporting LLM (Block Goose, Claude, etc.)

## Quick Start

```bash
# Install
git clone https://github.com/pblittle/lnd-mcp-server.git
cd lnd-mcp-server
npm install
npm run build
```

### Run with Mock Data (No LND Node Required)

For quick testing without an LND node:

```bash
# Run with mock data - no configuration needed
# The mock server automatically creates necessary mock certificates and macaroons
npm run mcp:mock
```

### Run with Real LND Node

To connect to a real LND node:

```bash
# Copy the example configuration
cp .env.example .env

# Edit .env with your LND node details
# Required settings:
# LND_TLS_CERT_PATH=/path/to/your/tls.cert
# LND_MACAROON_PATH=/path/to/your/readonly.macaroon
# LND_HOST=localhost
# LND_PORT=10009
# USE_MOCK_LND=false

# Run the server with real LND connection
npm run mcp:prod
```

## Example Queries and Responses

Here are some natural language queries you can use:

**Channel listing:**

```bash
> Show me all my channels

Your node has 5 channels with a total capacity of 0.05000000 BTC (5,000,000 sats).
4 channels are active and 1 is inactive.

Your largest channels:
1. ACINQ: 0.02000000 BTC (2,000,000 sats) (active)
2. Bitrefill: 0.01000000 BTC (1,000,000 sats) (active)
3. LightningTipBot: 0.00800000 BTC (800,000 sats) (active)
4. Wallet of Satoshi: 0.00700000 BTC (700,000 sats) (active)
5. LN+: 0.00500000 BTC (500,000 sats) (inactive)
```

**Channel health:**

```bash
> What is the health of my channels?

Channel Health Summary: 4 healthy, 1 needs attention.

You have 1 inactive channel that needs attention:
1. LN+: 0.00500000 BTC (500,000 sats)
```

**Liquidity distribution:**

```bash
> How is my channel liquidity distributed?

Liquidity Distribution: 0.02500000 BTC (2,500,000 sats) local (50%),
0.02500000 BTC (2,500,000 sats) remote (50%).

Your most balanced channels:
1. ACINQ: 50% local / 50% remote
2. Bitrefill: 50% local / 50% remote
3. LightningTipBot: 50% local / 50% remote

Your most imbalanced channels:
1. Wallet of Satoshi: 30% local / 70% remote
```

## Testing with Helper Scripts

You can test the server with the included scripts:

```bash
# List all channels
node test/real-queries/list.js

# Check channel health
node test/real-queries/health.js

# Check liquidity distribution
node test/real-queries/liquidity.js
```

## Using with MCP Inspector

The MCP Inspector provides an interactive way to test the server:

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Run the server (in a separate terminal)
npm run mcp:mock

# Launch MCP Inspector
npx @modelcontextprotocol/inspector
```

In the MCP Inspector web interface:

1. Click "Connect" in the top right
2. Set transport type to "stdio"
3. Provide the path to your `scripts/mock-server.js` file
4. Click "Connect" and start asking questions

## Documentation

- [Architecture](ARCHITECTURE.md) - Detailed design and implementation details
- [Contributing](CONTRIBUTING.md) - Guidelines for developers

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
