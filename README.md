# Lightning Network MCP Server

The Lightning Network MCP Server allows large language model (LLM) agents—such as those running in [Goose](https://block.github.io/goose/)—to query Lightning node data using natural language. It serves as a structured backend for LLM agents by implementing the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

The server connects to your node using gRPC or Lightning Node Connect (LNC), and returns both readable summaries and machine-readable JSON output. It is designed to be modular, testable, and extensible to support additional node types such as Core Lightning and Eclair.

For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).

## What It Does

The system interprets natural-language prompts, determines user intent, evaluates domain logic, and queries your Lightning node. Responses are returned in plain language and structured JSON. It currently supports basic channel queries and is actively evolving to cover broader node status, invoices, and routing data.

## Example Query

Ask in natural language:

```
Show me my channels
```

Get human-readable responses:

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

Plus structured JSON data for applications:

```json
{
  "channels": [
    {
      "remote_alias": "ACINQ",
      "capacity": 2000000,
      "local_balance": 800000,
      "active": true
    },
    ...
  ],
  "summary": {
    "total_capacity": 5000000,
    "active_channels": 4,
    "inactive_channels": 1,
    "largest_channel_alias": "ACINQ",
    "average_local_balance": 750000
  }
}
```

_The JSON output provides a structured version of the same data and is optimized for use by LLM agents, UI layers, or downstream applications._

## Supported Features

Today, the system supports basic channel queries:

- _“Show me my channels”_

More robust queries are in development across the following domains:

- **Channels**  
  _“What is the health of my channels?”_  
  _“Do I have any inactive channels?”_

- **Invoices**  
  _“How many invoices have I received this week?”_  
  _“What was my last payment?”_

- **Nodes**  
  _“What node am I connected to the most?”_  
  _“What node did I last forward a payment to?”_

- **Routing**  
  _“How much have I routed in the last 24 hours?”_  
  _“Which channels are doing most of the routing?”_

## Quick Start

### Run with Mock Data (No Node Required)

```bash
npm install
npm run build
npm run mcp:mock
```

### Run with a Real Node (LND via gRPC or LNC)

```bash
cp .env.example .env
# Configure .env with your LND credentials
npm run mcp:prod
```

## Test with MCP Inspector

To test the server using the official MCP inspector:

```bash
npm install -g @modelcontextprotocol/inspector
npm run mcp:mock
npx @modelcontextprotocol/inspector
```

## Compatibility

- MCP agent compatibility (e.g., Goose)
- gRPC support for direct node access
- LNC support for secure remote access
- JSON and natural-language output formats

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, style, and testing guidance.

## License

Apache License 2.0. See [LICENSE](LICENSE).
