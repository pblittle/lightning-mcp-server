# Contributing to the Lightning Network MCP Server

This project provides natural-language access to Lightning node data through the Model Context Protocol (MCP). It is built with a clean architecture focused on testability, modularity, and clarity. Contributions are welcome.

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/pblittle/lightning-mcp-server.git
   cd lightning-mcp-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server in mock mode:

   ```bash
   npm run build
   npm run mcp:mock
   ```

This runs a local MCP server with mock data and no Lightning node connection.

## Running with LND

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

2. Set the connection type:

   - `CONNECTION_TYPE=lnd-direct` for gRPC
   - `CONNECTION_TYPE=lnc` for Lightning Node Connect

3. Start the server:

   ```bash
   npm run mcp:prod
   ```

## MCP Inspector

To test natural-language queries, you can use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm install -g @modelcontextprotocol/inspector
npm run mcp:mock
npx @modelcontextprotocol/inspector
```

## Project Structure

The codebase is organized by layer:

```
src/
├── application/       Application logic and orchestration
├── core/              Logging, config, validation, and error handling
├── domain/            Business rules, entities, handlers
├── infrastructure/    Adapters and gateways (LND, LNC, etc.)
└── interfaces/        MCP-facing interface (controller, server entry point)
```

For architectural boundaries and design rationale, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Testing

This project uses `jest` for automated tests. All business logic should be covered by unit tests, and infrastructure should be tested with mock or real integration queries.

To run all tests:

```bash
npm test
```

To run example queries:

```bash
node test/real-queries/list.js
node test/real-queries/health.js
```

You can test in either mock or live mode depending on your environment setup.

## Linting and Formatting

Linting and formatting must pass before submitting a PR:

```bash
npm run lint
npm run format
npm run validate
```

## Commit Messages

We squash commits before merging and apply a consistent message format.

You don’t need to follow a strict convention, but commit messages should be clear and descriptive. Before opening a pull request, squash your commits into a single logical change.

For examples of message style, refer to recent commits in the main branch.

## Contribution Guidelines

- Keep pull requests focused and minimal
- Include meaningful tests for new functionality
- Use clear naming and types
- Follow layering boundaries—do not mix infrastructure and domain logic
- Avoid unnecessary abstractions
- Do not introduce new dependencies without discussion

## Security Considerations

When working with credentials, authentication tokens, or connection details:

- Never log sensitive information directly
- Use the existing sanitization utilities in `src/core/errors/sanitize.ts`
- If adding new types of sensitive information, update the `SENSITIVE_FIELD_PATTERNS` array
- Always add tests to verify proper redaction behavior
- Consider security implications when adding new connection methods

## Questions

Open a pull request or start a discussion. We're happy to support thoughtful contributions.
