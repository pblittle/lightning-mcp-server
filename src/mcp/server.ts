import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { LndClient } from '../lnd/client';
import { Config } from '../config';
import logger from '../utils/logger';
import { createMcpError } from './utils';
import { ChannelQueryTool } from './tools/channelQueryTool';
import { sanitizeError } from '../utils/sanitize';

/**
 * MCP Server for LND
 *
 * This server implements the Model Context Protocol to provide
 * natural language querying of Lightning Network channels.
 */
export class McpServer {
  private server: Server;
  private lndClient: LndClient;
  private channelQueryTool: ChannelQueryTool;

  /**
   * Initialize the MCP server
   * @param lndClient LND client instance
   * @param config Application configuration
   */
  constructor(lndClient: LndClient, _config: Config) {
    this.lndClient = lndClient;
    this.channelQueryTool = new ChannelQueryTool(lndClient);

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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        logger.debug('Handling ListTools request');

        return {
          tools: [
            {
              name: 'queryChannels',
              description: 'Query Lightning Network channels using natural language',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Natural language query about channels',
                  },
                },
                required: ['query'],
              },
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to handle ListTools request', { error });
        throw createMcpError(error, 'Failed to list tools');
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        logger.debug('Handling CallTool request', { name, args });

        if (name === 'queryChannels') {
          // Validate required arguments
          if (!args || !args.query || typeof args.query !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Missing or invalid query parameter');
          }

          // Execute the query
          const result = await this.channelQueryTool.executeQuery(args.query);

          return {
            content: [
              {
                type: 'text',
                text: result.response,
              },
              {
                type: 'application/json',
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        }

        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      } catch (error) {
        logger.error('Failed to handle CallTool request', { error, request });

        if (error instanceof McpError) {
          throw error;
        }

        throw createMcpError(error, 'Failed to execute tool');
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      // Check LND connection
      await this.lndClient.checkConnection();

      // Create transport
      const transport = new StdioServerTransport();

      // Connect the server
      await this.server.connect(transport);

      logger.info('MCP server started');
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to start MCP server', { error: { message: sanitizedError.message } });
      throw error;
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

/**
 * Create and start an MCP server
 * @param lndClient LND client instance
 * @param config Application configuration
 * @returns MCP server instance
 */
export async function createMcpServer(lndClient: LndClient, config: Config): Promise<McpServer> {
  const server = new McpServer(lndClient, config);
  await server.start();
  return server;
}
