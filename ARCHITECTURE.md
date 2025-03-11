# LND MCP Server Architecture

This document outlines the architecture for a clean, focused MCP server that connects to an LND node and allows users to execute safe LND commands.

## Overview

The LND MCP server is designed to:

1. Connect securely to an LND node using proper authentication
2. Implement MCP tools for executing safe LND commands
3. Provide a validation layer to ensure command safety
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
│   └── queries.ts           # Balance and other query functions
│
├── mcp/                     # MCP server implementation
│   ├── server.ts            # MCP server setup
│   ├── tools/               # MCP tools
│   │   └── executeLndCommand.ts  # Safe command execution tool
│   ├── validators/          # Command validation
│   │   └── commandValidator.ts   # Command validation logic
│   └── utils.ts             # Helper functions for MCP
│
├── types/                   # Type definitions
│   └── index.ts             # Shared type interfaces
│
├── utils/                   # Shared utilities
│   └── logger.ts            # Logging utility
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
- `queries.ts`: Implements functions to query the LND node for balance and other information

### 3. MCP Server

The `mcp` module implements the Model Context Protocol server:

- `server.ts`: Sets up the MCP server using the official SDK
- `tools/executeLndCommand.ts`: Implements a tool for safely executing LND commands
- `validators/commandValidator.ts`: Validates and sanitizes LND commands
- `utils.ts`: Provides helper functions for MCP server implementation

### 4. Utilities

The `utils` module provides shared utilities:

- `logger.ts`: Implements a logging utility using Pino

## Implementation Approach

### 1. Transport Layer

The server uses `StdioServerTransport` from the MCP SDK for compatibility with LLM interfaces. This allows the server to communicate with LLMs through standard input/output.

### 2. Command Execution Flow

The command execution flow follows these steps:

1. Client sends a command request to the MCP server
2. Server validates the command against a whitelist of allowed commands
3. Server validates the parameters for the specific command
4. Server maps the command to the appropriate ln-service function
5. Server executes the command with proper error handling
6. Server formats and returns the results

### 3. Command Validation and Safety

The server implements a robust validation layer to ensure command safety:

- Whitelist of allowed LND commands
- Parameter validation to prevent injection attacks
- Type checking for all command parameters
- Proper error handling for invalid commands
- Logging of all command executions for audit purposes

By default, only read-only commands are allowed. Write commands can be optionally enabled through configuration.

### 4. Error Handling

The server implements comprehensive error handling with proper error codes and messages. All errors are logged with appropriate context.

### 5. Testing Strategy

The testing strategy includes:

- Unit tests for LND queries
- Unit tests for command validation
- Integration tests for MCP tools
- Tests for each allowed command
- Tests for error handling and edge cases
- Mock LND responses for deterministic testing
- Mock server for testing without a real LND node

#### Mocking Approach

External dependencies like ln-service are mocked at the appropriate level:

- For direct function tests (e.g., command execution), the ln-service functions are mocked
- For tests of functions that call other internal functions, the underlying ln-service functions are mocked to test the full integration
- For manual testing and demonstration, a mock server implementation is provided

#### Mock Server Implementation

The project includes a mock server implementation (`mock-server.js`) that allows running the MCP server with a mocked LND connection:

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

#### Testing Error Handling

Error handling is tested by:

- Mocking dependencies to throw errors at different levels
- Verifying that errors are properly propagated and wrapped with context
- Ensuring that error logging occurs at each level
- Testing invalid commands and parameters

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
- `ALLOW_WRITE_COMMANDS`: Whether to allow write commands (default: false)
