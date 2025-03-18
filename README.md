# LND MCP Server

The LND MCP Server is an open-source, well-structured Model Context Protocol (MCP) server that connects to your Lightning Network Daemon (LND) node. It enables natural language queries to access node information, providing clear insights for anyone needing visibility into their LND nodes—from operators to technical stakeholders.

> **MVP Notice:** This initial release is an MVP that currently supports only channel data. Additional major use cases will be introduced once the core functionality has been thoroughly tested and refined.

Furthermore, this MCP server can be used with any LLM application that supports the Model Context Protocol, including Block Goose, Claude, and OpenAI-based applications.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
- [Usage Examples](#usage-examples)
- [Optional: MCP Inspector for Testing](#optional-mcp-inspector-for-testing)
- [API Documentation](#api-documentation)
- [Architecture Overview](#architecture-overview)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The MCP-LND Server bridges the gap between the technical details of your LND node and the operational needs of its users. By leveraging natural language processing, it translates everyday queries into actionable insights. This means you can ask questions like:

- "Show me all my channels"
- "What is the health of my channels?"
- "How is my channel liquidity distributed?"

The server fetches the required data from the LND node and formats the response into both a human-readable summary and structured JSON, making it ideal for both manual review and automated processing.

> **Note:** As an MVP, the current implementation focuses exclusively on channel data. Future updates will expand support to include additional types of LND node queries as the core is further tested and stabilized.

---

## Features

- **Natural Language Query Interface:** Ask simple, conversational questions about your LND node.
- **Secure LND Integration:** Connects to your LND node using TLS certificates and macaroons.
- **Dual-Format Responses:** Provides both clear textual summaries and machine-friendly JSON data.
- **Clean, Modular Architecture:** Designed for maintainability and easy extension.
- **MVP Focus:** Currently supports channel data queries, with plans for future expansion.
- **Mock LND Mode:** Supports development and testing without requiring a live LND node.
- **Extensible API:** Easily add new query types and natural language processing features.
- **LLM Compatibility:** Can be used with any LLM application that supports the Model Context Protocol, including Block Goose, Claude, and OpenAI-based applications.

---

## Installation

### Prerequisites

- **Node.js:** Version 14 or later.
- **npm:** Version 6 or later.
- **LND Node Access:** Ensure you have a running LND node. You will need:
  - A valid TLS certificate (typically found at `~/.lnd/tls.cert`)
  - A read-only macaroon (commonly located at `~/.lnd/data/chain/bitcoin/mainnet/readonly.macaroon`)
- **Environment Variables:** Properly configure your LND connection details.

### Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/pblittle/mcp-server-lnd.git
   cd mcp-server-lnd
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Build the Project:**

   ```bash
   npm run build
   ```

---

## Environment Configuration

The server uses a layered environment configuration to support different deployment scenarios (development, testing, production). Create an `.env` file (or an environment-specific variant) in the project root with the following variables:

```bash
# LND Node Configuration
LND_TLS_CERT_PATH=/path/to/your/tls.cert
LND_MACAROON_PATH=/path/to/your/readonly.macaroon
LND_HOST=localhost
LND_PORT=10009

# Server Configuration
PORT=3000
LOG_LEVEL=info

# Set to true to use a mock LND node (useful for development/testing)
USE_MOCK_LND=false
```

For testing, you may also use the provided `.env.test` file.

---

## Getting Started

Users can get started quickly by using the provided scripts and mock environment:

1. **Run in Development Mode (with Mock LND):**

   ```bash
   npm run mcp:dev
   ```

2. **For Production (with a Real LND Node):**

   ```bash
   npm run mcp:prod
   ```

3. **Using the Mock Server:**

   For testing purposes, launch the server with a mocked LND connection:

   ```bash
   npm run mcp:mock
   ```

The server will initialize and listen for JSON-RPC requests over standard input/output, making it compatible with MCP-compatible LLMs and inspection tools.

---

## Usage Examples

Once the server is running, you can interact with it using natural language queries. Here are a few examples:

- **List Channels:**

  ```bash
  node test/real-queries/list.js
  # Or interact via an MCP-compatible interface:
  # "Show me all my channels"
  ```

- **Check Channel Health:**

  ```bash
  node test/real-queries/health.js
  # Or simply ask:
  # "What is the health of my channels?"
  ```

- **Analyze Channel Liquidity:**

  ```bash
  node test/real-queries/liquidity.js
  # Or ask:
  # "How is my channel liquidity distributed?"
  ```

### Example Output

Below is an example output from running the channel list test:

```plaintext
node test/channel-queries/list.js
Sending query: "Show me all my channels"
Waiting for response...

Response from server:
--------------------------------------------------
Your node has 5 channels with a total capacity of 0.05000000 BTC (5,000,000 sats). 4 channels are active and 1 is inactive.

Your largest channels:
1. ACINQ: 0.02000000 BTC (2,000,000 sats) (active)
2. Bitrefill: 0.01000000 BTC (1,000,000 sats) (active)
3. LightningTipBot: 0.00800000 BTC (800,000 sats) (active)
4. Wallet of Satoshi: 0.00700000 BTC (700,000 sats) (active)
5. LN+: 0.00500000 BTC (500,000 sats) (inactive)

JSON Data:
--------------------------------------------------
{
  "channels": [
    {
      "capacity": 2000000,
      "local_balance": 1000000,
      "remote_balance": 1000000,
      "channel_point": "txid:0",
      "active": true,
      "remote_pubkey": "03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f",
      "remote_alias": "ACINQ"
    }
  ],
  "summary": {
    "totalCapacity": 5000000,
    "totalLocalBalance": 2500000,
    "totalRemoteBalance": 2500000,
    "activeChannels": 4,
    "inactiveChannels": 1,
    "averageCapacity": 1000000,
    "healthyChannels": 4,
    "unhealthyChannels": 1
  }
}
```

---

## Optional: MCP Inspector for Testing

For enhanced testing and exploration, you can optionally install [MCP Inspector](https://www.npmjs.com/package/@modelcontextprotocol/inspector). This tool provides a user-friendly web interface to connect to the MCP server, list available tools, and experiment with natural language queries.

### Installation

```bash
npm install -g @modelcontextprotocol/inspector
```

### Usage

1. **Start the MCP Server (e.g., in mock mode):**

   ```bash
   npm run mcp:mock
   ```

2. **Launch MCP Inspector:**

   ```bash
   npx @modelcontextprotocol/inspector
   ```

3. **Connect via the Web Interface:**
   - Click "Connect" in the top right.
   - Set the transport type to "stdio".
   - Provide the path to your `scripts/mock-server.js` file.
   - Click "Connect" to start interacting with your MCP server.

This step is optional and intended for developers who want an interactive testing experience.

---

## API Documentation

The MCP-LND Server exposes a natural language processing API that parses user queries and returns node information. The main components are:

### Intent Parser

- **Module:** `src/mcp/nlp/intentParser.ts`
- **Function:** `parseIntent(query: string): Intent`
- **Description:** Processes a natural language query and determines the user’s intent (e.g., channel list, channel health, channel liquidity).

### Channel Query Handler

- **Module:** `src/mcp/handlers/channelQueryHandler.ts`
- **Function:** `handleQuery(intent: Intent): Promise<QueryResult>`
- **Description:** Fetches the appropriate channel data from the LND node based on the parsed intent and returns a formatted result.

### Channel Query Tool

- **Module:** `src/mcp/tools/channelQueryTool.ts`
- **Function:** `executeQuery(query: string): Promise<{ response: string; data: Record<string, any> }>`
- **Description:** Integrates the intent parser and query handler to process natural language queries end-to-end.

Developers can extend these modules to add support for additional query types or refine natural language processing behavior.

---

## Architecture Overview

The project follows a clean, modular architecture designed for maintainability and scalability. Key aspects include:

- **Separation of Concerns:** Divided into modules for configuration, LND integration, natural language processing, request handling, and utilities.
- **Robust Error Handling:** Comprehensive logging and error sanitization ensure secure and reliable operation.
- **Testability:** Extensive unit and integration tests are included, with support for both real and mock LND node interactions.
- **Extensibility:** Designed to easily incorporate additional query types and functionality.

For a detailed explanation, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the Repository:** Create your own branch for new features or bug fixes.
2. **Follow Code Standards:** Adhere to the established coding standards and file structure.
3. **Write Tests:** Ensure that new code is covered by tests.
4. **Commit Messages:** Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add new channel query feature`).
5. **Submit a Pull Request:** Describe your changes and the problem they solve.

For more detailed instructions, see the [CONTRIBUTING.md](./CONTRIBUTING.md) (if available) or open an issue.

---

## License

This project is licensed under the [MIT License](./LICENSE). See the LICENSE file for details.
