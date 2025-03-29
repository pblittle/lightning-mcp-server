# Contribution Guide

Thanks for your interest in improving the Lightning Network MCP Server! This guide will help you get started with development quickly.

> **Note:** The current version focuses on channel data. Additional Lightning Network data types will be added in future releases.

## Quick Start

1. **Fork and clone the repo**

   ```bash
   git clone https://github.com/your-username/lightning-mcp-server.git
   cd lightning-mcp-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up for development**

   ```bash
   # For development with mock LND (no real node needed)
   cp .env.development.example .env.development
   ```

4. **Start coding!**

   ```bash
   # Run with auto-reload during development
   npm run dev

   # Or use mock LND mode (recommended for most development)
   npm run mcp:mock
   ```

## Development Tips

### Testing Your Changes

```bash
# Run unit tests
npm test

# Test with mock server
npm run mcp:mock

# In another terminal, run test queries
node test/real-queries/list.js
node test/real-queries/health.js
node test/real-queries/liquidity.js
node test/real-queries/query.js "Your custom query here"
```

### Code Formatting and Linting

We use Prettier and ESLint to keep code consistent:

```bash
# Format your code
npm run format

# Check for linting issues
npm run lint

# Fix linting issues
npm run lint:fix

# Validate code (lint, format check, and type check)
npm run validate
```

This project follows clean architecture principles and domain-driven design. It also adheres to TypeScript best practices based on Google's TypeScript Style Guide.

## Project Structure

The project follows a clean architecture approach with domain-driven design:

```bash
src/
├── application/       # Application layer
│   └── processors/    # Query processors
├── core/              # Cross-cutting concerns
│   ├── config/        # Configuration management
│   ├── errors/        # Error handling
│   ├── logging/       # Logging utilities
│   └── validation/    # Validation utilities
├── domain/            # Domain layer (core business logic)
│   ├── channels/      # Channel domain
│   │   ├── entities/  # Channel entities
│   │   ├── schemas/   # Schema definitions
│   │   └── value-objects/  # Domain value objects
│   ├── handlers/      # Domain operation handlers
│   ├── intents/       # Intent parsing
│   │   ├── entities/  # Intent models
│   │   ├── factories/ # Parser factories
│   │   └── strategies/  # Parsing strategies
│   ├── lightning/     # Lightning domain
│   │   └── gateways/  # Gateway interfaces
│   └── node/          # Node domain
├── infrastructure/    # Infrastructure layer
│   ├── factories/     # Infrastructure factories
│   ├── lnd/           # LND implementation
│   └── lnc/           # LNC implementation
└── interfaces/        # Interface layer
    └── mcp/           # MCP protocol implementation
```

## Key Architectural Concepts

### Clean Architecture

The codebase is organized into layers:

1. **Domain Layer**: Contains the core business logic, entities, value objects, and gateway interfaces
2. **Infrastructure Layer**: Implements the gateway interfaces for specific technologies (LND, LNC)
3. **Application Layer**: Orchestrates the flow between interfaces and domain logic
4. **Interface Layer**: Handles external communication via the MCP protocol

This layered approach ensures that the core business logic is isolated from implementation details. The current version supports Lightning Network Daemon (LND) as its primary implementation, with LNC (Lightning Node Connect) as a remote connection option. The clean architecture and gateway abstractions are designed to enable support for other Lightning Network implementations like Core Lightning (CLN) and Eclair as the project matures.

For more details on the infrastructure implementations and gateway pattern, see [ARCHITECTURE.md](ARCHITECTURE.md#3-infrastructure-layer).

### Domain-Driven Design

The domain model represents Lightning Network concepts through:

- **Entities**: Core domain objects with identity and lifecycle
- **Value Objects**: Immutable objects representing domain concepts without identity
- **Gateway Pattern**: Clean abstraction for accessing external systems
- **Domain Handlers**: Process domain-specific operations

### Design Patterns

The codebase uses several design patterns:

- **Gateway Pattern**: Abstracts external resources
- **Strategy Pattern**: Enables swappable implementations for intent parsing
- **Factory Pattern**: Creates appropriate implementations based on configuration
- **Value Object Pattern**: Encapsulates domain concepts

## Working with Mock LND

For most development, you can use mock mode instead of connecting to a real Lightning node:

```bash
# Run with mock data
npm run mcp:mock
```

This simulates an LND node with pre-defined channel data, making development much easier.

## Testing with MCP Inspector

The MCP Inspector provides an interactive way to test the server:

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Run the mock MCP server
npm run mcp:mock

# Launch MCP Inspector (in a separate terminal)
npx @modelcontextprotocol/inspector
```

## Testing with a Real LND Node

To test with a real LND node:

1. Create a `.env` file with your LND node details:

   ```bash
   cp .env.example .env
   # Edit .env with your LND node details
   ```

2. Run the server:

   ```bash
   npm run mcp:prod
   ```

3. In another terminal, run test queries:

   ```bash
   node test/real-queries/query.js "Show me all my channels"
   ```

## Submitting a Pull Request

1. Make your changes on a new branch

   ```bash
   git checkout -b your-feature-branch
   ```

2. Test your changes

   ```bash
   npm test
   npm run lint
   ```

3. Push to your fork and submit a PR

   ```bash
   git push origin your-feature-branch
   # Then go to GitHub and create a pull request
   ```

4. We'll review your PR as soon as possible

Your PR description should explain what the changes do and why they're needed.

## Type Safety and Validation

The system leverages TypeScript and Zod for robust type safety:

- **Static Types**: TypeScript provides compile-time checking
- **Runtime Validation**: Zod schemas validate input/output data
- **Schema/Type Alignment**: Types are derived from schemas to ensure consistency

## Future Extensibility

The architecture supports several extension points:

1. **New Lightning Implementations**: Add new gateway implementations in the infrastructure layer
2. **Enhanced NLP**: Replace the RegexIntentParser with more sophisticated NLP
3. **Additional Domain Data**: Expand beyond channels to payments, invoices, etc.
4. **Advanced Health Metrics**: Enhance health criteria and analysis capabilities

## Questions?

If you have questions or need help, feel free to open an issue. We're happy to assist.

Happy hacking!
