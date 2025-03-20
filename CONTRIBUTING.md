# Contribution Guide

Thanks for your interest in improving the LND MCP Server! This guide will help you get started quickly.

## Quick Start

1. **Fork and clone the repo**

   ```bash
   git clone https://github.com/your-username/lnd-mcp-server.git
   cd lnd-mcp-server
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
# Run tests
npm test

# Test with mock server
node test/channel-queries/list.js
```

### Code Formatting

We use Prettier and ESLint to keep code consistent:

```bash
# Format your code
npm run format

# Check for issues
npm run lint
```

This project follows clean-code-typescript principles based on Robert C. Martin's Clean Code principles.

## Project Structure

```bash
src/                # Source code
├── config/         # Configuration loading
├── lnd/            # LND client and queries
├── mcp/            # MCP server components
│   ├── formatters/ # Response formatters
│   ├── handlers/   # Query handlers
│   └── nlp/        # Natural language processing
├── types/          # TypeScript definitions
└── utils/          # Utility functions
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

## Working with Mock LND

For most development, you can use mock mode instead of connecting to a real Lightning node:

```bash
# Run with mock data
npm run mcp:mock
```

This simulates an LND node with pre-defined channel data, making development much easier.

## Questions?

If you have questions or need help, feel free to open an issue. We're happy to assist!

Happy coding!
