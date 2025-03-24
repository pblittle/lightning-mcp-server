/**
 * @fileoverview MCP Server for LND.
 *
 * This server implements the Model Context Protocol to provide
 * natural language querying of Lightning Network channels.
 * It sets up request handlers for listing and calling tools using the MCP SDK.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { LndClient } from '../../infrastructure/lnd/LndClient';
import { ChannelService } from '../../domain/channels/services/ChannelService';
import { Config } from '../../core/config/index';
import logger from '../../core/logging/logger';
import { ChannelQueryTool } from './ChannelMcpController';
import { sanitizeError } from '../../core/errors/sanitize';

// Create the MCP server
export class McpServer {
  private server: Server;
  private lndClient: LndClient;
  private channelQueryTool: ChannelQueryTool;

  /**
   * Initialize the MCP server
   * @param lndClient LND client instance
   * @param channelService Domain service for channel operations
   * @param config Application configuration
   */
  constructor(lndClient: LndClient, channelService: ChannelService, _config: Config) {
    this.lndClient = lndClient;
    this.channelQueryTool = new ChannelQueryTool(channelService);

    // Create the MCP server
    this.server = new Server(
      {
        name: 'lnd-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up request handlers
    this.setupRequestHandlers();

    // Set up error handler
    this.server.onerror = (error) => {
      const sanitizedError = sanitizeError(error);
      logger.error('MCP server error', { error: { message: sanitizedError.message } });
    };

    logger.info('MCP server initialized');
  }

  /**
   * Set up MCP request handlers
   */
  private setupRequestHandlers(): void {
    // Register handler for listTools method
    this.server.setRequestHandler(ListToolsRequestSchema, (_request) => {
      try {
        // Generate a request ID to track this request
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        logger.info('Handling listTools request', { requestId });

        return {
          tools: [this.channelQueryTool.getMetadata()],
          _meta: { requestId },
        };
      } catch (error) {
        const sanitizedError = sanitizeError(error);
        logger.error('Failed to handle listTools request', {
          error: { message: sanitizedError.message },
        });
        throw sanitizedError;
      }
    });

    // Register handler for calling a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Dispatch the tool call based on the requested tool name
        if (request.params.name === 'queryChannels') {
          // Type checking for arguments
          if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
            throw new Error('Invalid query: expected a string');
          }

          const query = request.params.arguments.query;
          const result = await this.channelQueryTool.executeQuery(query);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } else {
          throw new Error(`Tool ${request.params.name} not found`);
        }
      } catch (error) {
        const sanitizedError = sanitizeError(error);
        logger.error('Tool call failed', { error: { message: sanitizedError.message } });
        throw sanitizedError;
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('MCP server started successfully');
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to start MCP server', { error: { message: sanitizedError.message } });
      throw sanitizedError;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
      this.lndClient.close();
      logger.info('MCP server stopped');
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Error stopping MCP server', { error: { message: sanitizedError.message } });
    }
  }
}
