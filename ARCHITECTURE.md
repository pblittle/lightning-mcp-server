# LND MCP Server Architecture

This document outlines the architecture for a clean, focused MCP server that connects to an LND node and allows users to query node data using natural language.

## Overview

The LND MCP server is designed to:

1. Connect securely to an LND node using proper authentication
2. Implement MCP tools for natural language queries of LND data
3. Process natural language to understand user intent
4. Follow best practices for error handling, logging, and configuration
5. Be well-tested and maintainable

## Architecture

The architecture follows clean architecture principles with clear separation of concerns:

```plaintext
src/
├── config/                  # Configuration management
│   └── index.ts             # Load and validate environment variables
│
├── lnd/                     # LND integration
│   ├── client.ts            # LND client setup and connection
│   └── queries.ts           # Channel and other query functions
│
├── mcp/                     # MCP server implementation
│   ├── server.ts            # MCP server setup
│   ├── formatters/          # Data formatters
│   │   └── channelFormatter.ts  # Format channel data into human-readable responses
│   ├── handlers/            # Request handlers
│   │   └── channelQueryHandler.ts  # Handle channel-related queries
│   ├── nlp/                 # Natural language processing
│   │   └── intentParser.ts  # Parse natural language into intents
│   └── tools/               # MCP tools
│       └── channelQueryTool.ts  # Natural language channel query tool
│
├── types/                   # Type definitions
│   ├── index.ts             # Shared type interfaces
│   ├── channel.ts           # Channel-related types
│   └── intent.ts            # Intent-related types
│
├── utils/                   # Shared utilities
│   ├── logger.ts            # Logging utility
│   └── sanitize.ts          # Input sanitization
│
├── __tests__/               # Test files
│   ├── setup.ts             # Test setup
│   └── *.test.ts            # Test files
│
└── index.ts                 # Application entry point
```

## Key Components

### 1. Configuration Management

The `config` module is responsible for loading and validating environment variables. It ensures that all required configuration is present and valid before the application starts.

### 2. LND Integration

The `lnd` module handles all interaction with the Lightning Network Daemon:

- `client.ts`: Sets up the connection to the LND node using TLS certificates and macaroons
- `queries.ts`: Implements functions to query the LND node for channel and other information

### 3. Natural Language Processing

The `nlp` module is responsible for understanding natural language queries:

- `intentParser.ts`: Parses natural language to determine the user's intent and extract parameters
- Supports multiple intent types, such as listing channels, checking channel health, and analyzing liquidity

### 4. Domain Handlers and Formatters

- `handlers/channelQueryHandler.ts`: Processes requests based on the intent, fetches data from LND, and prepares responses
- `formatters/channelFormatter.ts`: Formats raw LND data into human-readable text and structured JSON

### 5. MCP Server and Tools

- `server.ts`: Sets up the MCP server using the official SDK
  - Uses `setRequestHandler` with schema objects from `@modelcontextprotocol/sdk/types.js`
  - Handles `ListToolsRequestSchema` and `CallToolRequestSchema` requests
  - Provides proper error handling and logging
- `tools/channelQueryTool.ts`: Implements the natural language query tool
  - Exposes metadata for tool discovery
  - Processes natural language queries through the intent parser
  - Returns both human-readable text and structured data

### 6. Utilities

The `utils` module provides shared utilities:

- `logger.ts`: Implements a logging utility using Pino
- `sanitize.ts`: Sanitizes inputs and outputs

## Implementation Approach

### 1. Transport Layer

The server uses `StdioServerTransport` from the MCP SDK for compatibility with LLM interfaces. This allows the server to communicate with LLMs through standard input/output.

### 2. Natural Language Query Flow

The natural language query flow follows these steps:

1. Client sends a natural language query to the MCP server
2. Server parses the query to determine the intent (e.g., list channels, check health, analyze liquidity)
3. Server fetches the relevant data from LND based on the intent
4. Server formats the data into both human-readable text and structured JSON
5. Server returns the formatted response to the client

### 3. Intent Recognition

The server uses pattern matching and keyword analysis to recognize different types of intents:

- **List Intent**: Recognizes queries about listing or showing channels
- **Health Intent**: Recognizes queries about channel health, status, or problems
- **Liquidity Intent**: Recognizes queries about balance, liquidity, or distribution

Each intent type has associated patterns and keywords for recognition, making it easy to extend with additional intent types in the future.

### 4. Response Formatting

Responses include both:

1. **Human-readable text**: Formatted for readability with summaries and highlights
2. **Structured JSON data**: For programmatic use

This dual-format approach allows both humans and machines to efficiently use the information.

### 5. Testing Strategy

The testing strategy includes:

- Unit tests for LND queries
- Unit tests for intent parsing
- Unit tests for response formatting
- Integration tests for the full query flow
- Tests for error handling and edge cases
- Mock LND responses for deterministic testing
- Mock server for testing without a real LND node

#### Mocking Approach

External dependencies like ln-service are mocked at the appropriate level:

- For direct function tests, the ln-service functions are mocked
- For tests of functions that call other internal functions, the underlying ln-service functions are mocked to test the full integration
- For manual testing and demonstration, a mock server implementation is provided

#### Mock Server Implementation

The project includes a mock server implementation (`scripts/mock-server.js`) that allows running the MCP server with a mocked LND connection:

1. **Mock LND Client**: A mock implementation of the LND client that returns predefined responses
2. **Mock Files**: Creates mock TLS certificate and macaroon files in a `mock` directory
3. **Environment Variables**: Sets up environment variables to point to the mock files
4. **Server Integration**: Uses the real MCP server implementation with the mock LND client

This allows:

- Testing the MCP server without a real LND node
- Developing and testing LLM applications that use the MCP server
- Demonstrating the MCP server functionality without requiring a real LND node

#### Test Isolation

Tests are carefully isolated to prevent one test from affecting others:

- Mocks are reset between tests using jest.clearAllMocks()
- Mock implementations are restored to their default values after tests that modify them
- Each test focuses on testing a single responsibility

## Extensibility

The architecture is designed for extensibility:

1. **New Intent Types**: Additional intents can be added by extending the intent parser
2. **New Query Types**: New query handlers can be implemented for different types of LND data
3. **Additional Formatters**: New formatters can be added for different types of data
4. **Enhanced NLP**: The NLP module can be extended with more sophisticated parsing techniques

## Dependencies

- `@modelcontextprotocol/sdk`: Official MCP SDK
- `ln-service`: Library for interacting with LND
- `dotenv`: Environment variable management
- `pino`: Logging library

## Configuration

The server requires the following environment variables:

- `LND_TLS_CERT_PATH`: Path to the LND TLS certificate
- `LND_MACAROON_PATH`: Path to the LND macaroon file
- `LND_HOST`: LND host (default: localhost)
- `LND_PORT`: LND port (default: 10009)

## Development Notes

### MCP SDK Integration

The server integrates with the MCP SDK using:

- `Server` class from `@modelcontextprotocol/sdk/server/index.js`
- `StdioServerTransport` for communication
- Request schemas from `@modelcontextprotocol/sdk/types.js`

When updating the MCP SDK, be aware that the API may change. Key integration points:

- Request handler registration using `setRequestHandler`
- Request schema validation
- Response formatting

### Type Definitions

The project uses several key type definitions:

- `Intent`: Represents the parsed user intent with type, query, and optional error
- `QueryResult`: Represents the result of a query with response text and structured data
- `Channel`: Represents LND channel data
- `ChannelSummary`: Represents aggregated channel statistics

Ensure consistency between these types across different modules to prevent TypeScript errors.
