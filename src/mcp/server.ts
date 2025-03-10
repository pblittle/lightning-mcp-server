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
import { ExecuteLndCommandTool } from './tools/executeLndCommand';
import { createMcpError } from './utils';

/**
 * MCP Server for LND
 *
 * This server implements the Model Context Protocol to provide
 * safe access to LND node functionality.
 */
export class McpServer {
  private server: Server;
  private lndClient: LndClient;
  private executeLndCommandTool: ExecuteLndCommandTool;

  /**
   * Initialize the MCP server
   * @param lndClient LND client instance
   * @param config Application configuration
   */
  constructor(lndClient: LndClient, config: Config) {
    this.lndClient = lndClient;

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

    // Initialize tools
    this.executeLndCommandTool = new ExecuteLndCommandTool(lndClient, config);

    // Set up request handlers
    this.setupRequestHandlers();

    // Set up error handler
    this.server.onerror = (error) => {
      logger.error({ error }, 'MCP server error');
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
              name: 'executeLndCommand',
              description: 'Execute a safe LND command',
              inputSchema: {
                type: 'object',
                properties: {
                  command: {
                    type: 'string',
                    description: 'Name of the LND command to execute',
                  },
                  params: {
                    type: 'object',
                    description: 'Parameters for the command',
                  },
                },
                required: ['command'],
              },
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'Failed to handle ListTools request');
        throw createMcpError(error, 'Failed to list tools');
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        logger.debug({ name, args }, 'Handling CallTool request');

        if (name === 'executeLndCommand') {
          // Validate required arguments
          if (!args || !args.command || typeof args.command !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Missing or invalid command parameter');
          }

          // Execute the command
          const params = args.params || {};
          const result = await this.executeLndCommandTool.executeCommand(args.command, params);

          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        }

        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      } catch (error) {
        logger.error({ error, request }, 'Failed to handle CallTool request');

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
      logger.fatal({ error }, 'Failed to start MCP server');
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
      logger.error({ error }, 'Error stopping MCP server');
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
