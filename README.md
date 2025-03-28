# Lightning Network MCP Server

An MCP server that connects to your Lightning Network node and enables natural language queries for channel information. Supports both direct LND connections and Lightning Node Connect (LNC) for secure remote access.

> **Note:** The current version focuses on channel data. Additional Lightning Network data types will be added in future releases.

## What is it?

Lightning Network MCP Server connects your Lightning Network node to LLM applications through the Model Context Protocol. Ask questions in natural language and get human-readable responses alongside structured JSON data.

## Features

- **Natural Language Queries:** Query Lightning Network node data using plain English
- **Multiple Connection Types:**
  - Direct LND connection via gRPC
  - Lightning Node Connect (LNC) for secure remote access
  - Mock mode for development without a real node
- **Clean, Modular Design:**
  - Flexible connection options
  - Easily extensible for new features
  - Type-safe throughout the codebase
- **Developer-Friendly:**
  - Strong data validation with Zod
  - Comprehensive error handling and logging
  - Clear separation of concerns
- **MCP Protocol Integration:**
  - Compliant responses for LLM integration
  - Compatible with any MCP-supporting LLM (Claude, Block Goose, etc.)

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
npm run mcp:mock
```

### Run with Direct LND Connection

To connect directly to an LND node:

```bash
# Copy the example configuration
cp .env.example .env

# Edit .env with your LND node details
# Required settings:
# CONNECTION_TYPE=lnd-direct
# LND_TLS_CERT_PATH=/path/to/your/tls.cert
# LND_MACAROON_PATH=/path/to/your/readonly.macaroon
# LND_HOST=localhost
# LND_PORT=10009

# Run the server with LND connection
npm run mcp:prod
```

### Run with Lightning Node Connect (LNC)

To connect remotely using Lightning Node Connect:

```bash
# Copy the example configuration
cp .env.example .env

# Edit .env with your LNC details
# Required settings:
# CONNECTION_TYPE=lnc
# LNC_CONNECTION_STRING=your-connection-string
# LNC_PAIRING_PHRASE=optional-pairing-phrase

# Run the server with LNC connection
npm run mcp:prod
```

## Example Queries

Here are some natural language queries you can use:

**Channel listing:**

```
Show me all my channels
List my active channels
```

**Channel health:**

```
What is the health of my channels?
Do I have any inactive channels?
```

**Liquidity distribution:**

```
How is my channel liquidity distributed?
Which channels are most imbalanced?
```

## Sample Response

For a channel listing query, you'll get a response like:

```
Your node has 5 channels with a total capacity of 0.05000000 BTC (5,000,000 sats).
4 channels are active and 1 is inactive.

Your channels:
1. ACINQ: 0.02000000 BTC (2,000,000 sats) (active)
2. Bitrefill: 0.01000000 BTC (1,000,000 sats) (active)
3. LightningTipBot: 0.00800000 BTC (800,000 sats) (active)
4. Wallet of Satoshi: 0.00700000 BTC (700,000 sats) (active)
5. LN+: 0.00500000 BTC (500,000 sats) (inactive)
```

## Testing with Helper Scripts

You can test the server with the included scripts. Make sure to have the mock server running first:

```bash
# Start the mock server in one terminal
npm run mcp:mock

# In another terminal, run test queries
node test/real-queries/list.js    # List all channels
node test/real-queries/health.js  # Check channel health
node test/real-queries/liquidity.js  # Check liquidity distribution
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

## Architecture

For detailed architectural information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and setup instructions.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
