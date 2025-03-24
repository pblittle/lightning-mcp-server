import { Config } from './core/config';
import { LndClient } from './infrastructure/lnd/LndClient';
import { LndChannelRepository } from './infrastructure/lnd/LndChannelRepository';
import { ChannelService } from './domain/channels/services/ChannelService';
import { McpServer } from './interfaces/mcp/McpServer';

/**
 * Creates and wires up all dependencies for the application
 * @param config Application configuration
 * @returns Initialized MCP server
 */
export async function createMcpServer(config: Config): Promise<McpServer> {
  // Create LND client
  const lndClient = new LndClient(config);

  // Create repositories
  const channelRepository = new LndChannelRepository(lndClient);

  // Create domain services
  const channelService = new ChannelService(channelRepository);
  // Create and start the MCP server using updated constructor parameters
  const mcpServer = new McpServer(lndClient, channelService, config);
  await mcpServer.start();

  return mcpServer;
}
