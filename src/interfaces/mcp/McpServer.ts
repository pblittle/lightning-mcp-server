/**
 * @fileoverview MCP Server for Lightning Network.
 *
 * This server implements the Model Context Protocol to provide
 * natural language querying of Lightning Network data.
 * It uses a flexible, extensible architecture with domain handlers
 * and a gateway pattern for accessing Lightning Network data.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { Config } from '../../core/config/index';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import { LightningMcpController } from './LightningMcpController';
import { LightningQueryProcessor } from '../../application/processors/LightningQueryProcessor';
import { IntentParserFactory } from '../../domain/intents/factories/IntentParserFactory';
import { DomainHandlerRegistry } from '../../domain/handlers/DomainHandlerRegistry';
import { ChannelDomainHandler } from '../../domain/handlers/ChannelDomainHandler';
import { LightningNetworkGateway } from '../../domain/lightning/gateways/LightningNetworkGateway';
import { LightningNetworkGatewayFactory } from '../../infrastructure/factories/LightningNetworkGatewayFactory';

/**
 * MCP server for Lightning Network
 */
export class McpServer {
  private server: Server;
  private connection: LightningNodeConnection;
  private lightningController: LightningMcpController;

  /**
   * Initialize the MCP server
   * @param connection Lightning Network node connection
   * @param gateway Lightning Network gateway
   * @param config Application configuration
   */
  constructor(
    connection: LightningNodeConnection,
    gateway: LightningNetworkGateway,
    config: Config
  ) {
    // Store the connection
    this.connection = connection;

    // Create the domain handler registry
    const handlerRegistry = new DomainHandlerRegistry();

    // Register domain handlers
    const channelHandler = new ChannelDomainHandler(gateway);
    handlerRegistry.register('channels', channelHandler);
    handlerRegistry.registerDefault(channelHandler); // Use channel handler as default for now

    // Create the intent parser
    const intentParser = IntentParserFactory.createParser(config);

    // Create the query processor
    const queryProcessor = new LightningQueryProcessor(intentParser, handlerRegistry);

    // Create the MCP controller
    this.lightningController = new LightningMcpController(queryProcessor);

    // Create the MCP server
    this.server = new Server(
      {
        name: 'lightning-mcp-server',
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
   * Create an MCP server from configuration
   * @param config Application configuration
   * @returns Promise resolving to an MCP server
   */
  static async createFromConfig(config: Config): Promise<McpServer> {
    try {
      // Create a connection based on the configuration
      const connection = await createConnectionFromConfig(config);

      // Create a gateway based on the connection
      const gateway = LightningNetworkGatewayFactory.create(connection);

      // Create the MCP server
      return new McpServer(connection, gateway, config);
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to create MCP server from config', {
        error: { message: sanitizedError.message },
      });
      throw sanitizedError;
    }
  }

  /**
   * Set up MCP request handlers
   * @private
   */
  private setupRequestHandlers(): void {
    // Register handler for listTools method
    this.server.setRequestHandler(ListToolsRequestSchema, (_request) => {
      try {
        // Generate a request ID to track this request
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        logger.info('Handling listTools request', { requestId });

        return {
          tools: [this.lightningController.getMetadata()],
          _meta: { requestId },
        };
      } catch (error) {
        const sanitizedError = sanitizeError(error);
        logger.error('Failed to handle listTools request', {
          error: { message: sanitizedError.message },
        });
        throw new McpError(ErrorCode.InternalError, sanitizedError.message);
      }
    });

    // Register handler for calling a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Dispatch the tool call based on the requested tool name
        if (request.params.name === 'queryLightning') {
          // Type checking for arguments
          if (
            !request.params.arguments ||
            typeof request.params.arguments !== 'object' ||
            typeof request.params.arguments.query !== 'string'
          ) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Invalid query: expected a string in the query parameter'
            );
          }

          const query = request.params.arguments.query;
          const result = await this.lightningController.executeQuery(query);

          // Convert the result to the format expected by the MCP SDK
          return {
            content: result.content,
            data: result.data,
            isError: result.isError,
          };
        } else {
          throw new McpError(ErrorCode.MethodNotFound, `Tool ${request.params.name} not found`);
        }
      } catch (error) {
        const sanitizedError = sanitizeError(error);
        logger.error('Tool call failed', { error: { message: sanitizedError.message } });

        if (error instanceof McpError) {
          throw error;
        } else {
          throw new McpError(ErrorCode.InternalError, sanitizedError.message);
        }
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

      // Close the connection
      this.connection.close();

      logger.info('MCP server stopped');
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error('Error stopping MCP server', { error: { message: sanitizedError.message } });
    }
  }
}

/**
 * Create a connection from configuration
 * @param config Application configuration
 * @returns Promise resolving to a Lightning Network connection
 * @private
 */
async function createConnectionFromConfig(config: Config): Promise<LightningNodeConnection> {
  try {
    // Import the connection factory
    const { ConnectionFactory } = await import('../../infrastructure/factories/ConnectionFactory');

    // Create the connection
    return ConnectionFactory.createFromConfig(config);
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    logger.error('Failed to create connection from config', {
      error: { message: sanitizedError.message },
    });
    throw sanitizedError;
  }
}
