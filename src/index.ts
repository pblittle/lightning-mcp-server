import dotenv from 'dotenv';
import logger from './utils/logger';
import { getConfig } from './config';
import { createLndClient } from './lnd/client';
import { createMcpServer } from './mcp/server';
import { sanitizeError } from './utils/sanitize';

// Load environment variables
dotenv.config();
logger.info('Environment variables loaded');

// Global reference to the MCP server for cleanup
let mcpServer: Awaited<ReturnType<typeof createMcpServer>> | null = null;

/**
 * Main function
 */
async function main() {
  try {
    logger.info('Starting MCP-LND server');

    // Load configuration
    const config = getConfig();

    // Create LND client
    const lndClient = createLndClient(config);

    // Check LND connection
    await lndClient.checkConnection();

    // Create and start MCP server
    mcpServer = await createMcpServer(lndClient, config);

    logger.info('MCP-LND server started');
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    logger.fatal(`Failed to start application: ${sanitizedError.message}`);
    process.exit(1);
  }
}

// Start the application
main();

// Handle graceful shutdown
async function shutdown() {
  try {
    if (mcpServer) {
      await mcpServer.stop();
    }
    logger.info('Server shutdown complete');
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    logger.error(`Error during shutdown: ${sanitizedError.message}`);
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  shutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  shutdown();
});
