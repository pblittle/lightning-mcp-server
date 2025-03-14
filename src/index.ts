import logger from './utils/logger';
import { getConfig } from './config';
import { createLndClient } from './lnd/client';
import { createMcpServer } from './mcp/server';
import { sanitizeError, sanitizeForLogging } from './utils/sanitize';

/**
 * Exit the process safely
 * @param code Exit code
 */
function exitProcess(code: number): void {
  // In test environment, process.exit is mocked by Jest
  // In non-test environments, actually exit the process
  process.exit(code);
}

// Global reference to the MCP server for cleanup
let mcpServer: Awaited<ReturnType<typeof createMcpServer>> | null = null;

/**
 * Main application bootstrap function
 */
export async function bootstrap() {
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
    logger.error(`Failed to start application: ${sanitizedError.message}`, {
      error: sanitizeForLogging(error),
    });
    exitProcess(1);
  }
}

// Start the application only when this file is run directly, not when imported
if (require.main === module) {
  bootstrap();
}

// Handle graceful shutdown
async function shutdown() {
  try {
    if (mcpServer) {
      await mcpServer.stop();
    }
    logger.info('Server shutdown complete');
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    logger.error(`Error during shutdown: ${sanitizedError.message}`, {
      error: sanitizeForLogging(error),
    });
  } finally {
    exitProcess(0);
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
