import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { LndClient } from '../lnd/client';
import { Config } from '../config';
import logger from '../utils/logger';
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
    // Register handler for listTools method
    this.server.setRequestHandler(ListToolsRequestSchema, (_request) => {
      try {
        // Generate a request ID to track this request
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        logger.info('Handling listTools request', {
          component: 'mcp-server',
          requestId: requestId,
          method: 'listTools',
        });

        const tools = [this.channelQueryTool.getMetadata()];

        logger.debug('Returning tools list', {
          component: 'mcp-server',
          requestId: requestId,
          toolCount: tools.length,
        });

        return { tools };
      } catch (error) {
        logger.error('Error handling listTools request', {
          component: 'mcp-server',
          method: 'listTools',
        });

        throw error;
      }
    });

    // Register handler for callTool method
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, args } = request.params;
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      try {
        logger.info('Handling callTool request', {
          component: 'mcp-server',
          requestId: requestId,
          toolName: name,
          method: 'callTool',
        });

        if (!name) {
          const error = new Error('Missing tool name');
          logger.error('Missing tool name in request', error, {
            component: 'mcp-server',
            requestId: requestId,
          });
          throw error;
        }

        if (name === 'queryChannels' || name === 'channel_query') {
          const startTime = Date.now();
          const parsedArgs = JSON.parse(args as string);
          const query = parsedArgs.query;

          if (!query) {
            const error = new Error('Missing query parameter');
            logger.error('Missing query parameter', error, {
              component: 'mcp-server',
              requestId: requestId,
              toolName: name,
            });
            throw error;
          }

          logger.info('Executing channel query', {
            component: 'mcp-server',
            requestId: requestId,
            query: query,
          });

          const result = await this.channelQueryTool.executeQuery(query);

          const duration = Date.now() - startTime;
          logger.info('Channel query completed', {
            component: 'mcp-server',
            requestId: requestId,
            durationMs: duration,
          });

          return result;
        } else {
          const error = new Error(`Unknown tool: ${name}`);
          logger.error('Unknown tool requested', error, {
            component: 'mcp-server',
            requestId: requestId,
            toolName: name,
          });
          throw error;
        }
      } catch (error) {
        logger.error('Error handling callTool request', {
          component: 'mcp-server',
          requestId: requestId,
          toolName: name,
        });

        throw error;
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
