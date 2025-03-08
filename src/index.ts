import dotenv from 'dotenv';
import logger from './utils/logger';

// Load environment variables
dotenv.config();
logger.info('Environment variables loaded');

/**
 * Main function
 */
async function main() {
  try {
    logger.info('Starting MCP-LND server');

    // TODO: Implement MCP server

    logger.info('MCP-LND server started');
  } catch (error) {
    logger.fatal({ error }, 'Failed to start application');
    process.exit(1);
  }
}

// Start the application
main();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
