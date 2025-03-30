/**
 * @fileoverview Application composition root.
 *
 * Creates and wires up all dependencies for the application
 * using dependency injection patterns for loose coupling.
 * This module implements the Composition Root pattern to centralize
 * dependency creation and wiring.
 */

import { Config } from './core/config';
import { McpServer } from './interfaces/mcp/McpServer';
import logger from './core/logging/logger';

/**
 * Creates and wires up all dependencies for the application
 * @param config Application configuration
 * @returns Initialized MCP server
 */
export async function createMcpServer(config: Config): Promise<McpServer> {
  logger.info(
    `Creating MCP server (implementation: ${config.node.implementation}, method: ${config.node.connectionMethod})`
  );

  // Create the MCP server using the factory method
  const mcpServer = await McpServer.createFromConfig(config);

  // Start the server
  await mcpServer.start();

  return mcpServer;
}
