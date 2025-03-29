/**
 * @fileoverview Main application entry point. Initializes and coordinates components.
 *
 * Bootstraps the application by:
 * 1. Loading configuration
 * 2. Creating the Lightning Network connection (LND or LNC)
 * 3. Creating and starting the enhanced MCP server
 * 4. Setting up graceful shutdown handling
 */

import logger from './core/logging/logger';
import { getConfig } from './core/config';
import { createMcpServer } from './composition';
import { sanitizeError } from './core/errors/sanitize';

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
    logger.info('Starting Lightning Network MCP server');

    // Load configuration
    const config = getConfig();

    // Create and start the MCP server using the composition module
    mcpServer = await createMcpServer(config);

    logger.info('Lightning Network MCP server started');
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    logger.error(`Failed to start application: ${sanitizedError.message}`, sanitizedError);
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
    logger.error(`Error during shutdown: ${sanitizedError.message}`, sanitizedError);
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
