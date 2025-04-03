/**
 * @fileoverview MCP Server for Lightning Network.
 *
 * This server implements the Model Context Protocol to provide
 * natural language querying of Lightning Network data.
 * It uses a flexible, extensible architecture with domain handlers
 * and a gateway pattern for accessing Lightning Network data.
 */

import { Server as McpSdkServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LightningNodeConnection } from '../../domain/node/LightningNodeConnection';
import { Config } from '../../core/config/index';
import {
  NodeImplementation,
  ConnectionMethod,
  LndGrpcDetails,
  LndLncDetails,
  SupportedConnectionDetails,
} from '../../domain/node/ConnectionAuth';
import { ConnectionFactory } from '../../infrastructure/factories/ConnectionFactory';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import { LightningMcpController } from './LightningMcpController';
import { LightningQueryProcessor } from '../../application/processors/LightningQueryProcessor';
import { IntentParserFactory } from '../../domain/intents/factories/IntentParserFactory';
import { DomainHandlerRegistry } from '../../domain/handlers/DomainHandlerRegistry';
import { ChannelDomainHandler } from '../../domain/handlers/ChannelDomainHandler';
import { LightningNetworkGateway } from '../../domain/lightning/gateways/LightningNetworkGateway';
import { LightningNetworkGatewayFactory } from '../../infrastructure/factories/LightningNetworkGatewayFactory';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
  CallToolRequest,
  ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP server for Lightning Network
 */
export class McpServer {
  private server: McpSdkServer;
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

    // Create the MCP server with explicit capabilities and protocol version
    this.server = new McpSdkServer(
      {
        name: 'lightning-mcp-server',
        version: '1.0.0',
        protocolVersion: '2025-03-26', // Latest protocol version
      },
      {
        capabilities: {
          resources: {}, // Indicate we support resources
          tools: {}, // Indicate we support tools
        },
      }
    );

    // Register the queryChannels tool and resources
    this.registerHandlers();

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
      const gateway = LightningNetworkGatewayFactory.create(
        connection,
        NodeImplementation.LND // For now, only LND is supported
      );

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
   * Register all MCP handlers for resources and tools
   * @private
   */
  private registerHandlers(): void {
    this.registerResources();
    this.registerTools();
  }

  /**
   * Register resources for the MCP server
   * @private
   */
  private registerResources(): void {
    // Register resources/list handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'lightning://docs',
            name: 'Lightning Network Documentation',
            description: 'Documentation for using the Lightning Network MCP server',
            mimeType: 'text/markdown',
          },
        ],
      };
    });

    // Register resources/read handler
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: ReadResourceRequest) => {
        if (request.params.uri === 'lightning://docs') {
          return {
            contents: [
              {
                uri: request.params.uri,
                text: `# Lightning MCP Server Documentation

## Overview
This server provides tools to query your Lightning Network node in natural language.

## Available Tools
- **queryChannels**: Get information about your Lightning Network channels

## Available Queries
- "Show me my channels"
- "Show me inactive channels"
- "Show channels with Bitrefill only"

These queries will return both human-readable descriptions and structured JSON data.
`,
                mimeType: 'text/markdown',
              },
            ],
          };
        }

        // Handle unknown resources with proper error
        throw new McpError(
          -32601, // METHOD_NOT_FOUND
          `Resource not found: ${request.params.uri}`,
          {
            metadata: {
              attemptedUri: request.params.uri,
              availableResources: ['lightning://docs'],
            },
          }
        );
      }
    );
  }

  /**
   * Register Lightning tools with the MCP server
   * @private
   */
  private registerTools(): void {
    // Register tools/list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
                  description: 'Natural language query about Lightning Network channels',
                },
              },
              required: ['query'],
            },
            annotations: {
              title: 'Query Lightning Channels',
              readOnlyHint: true, // This is a read-only operation
              openWorldHint: false, // Operates on a closed world (just the channels)
            },
          },
        ],
      };
    });

    // Register tools/call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      try {
        // Validate tool name
        if (request.params.name !== 'queryChannels') {
          throw new McpError(ErrorCode.MethodNotFound, `Unsupported tool: ${request.params.name}`);
        }

        // Get query from arguments
        const query = request.params.arguments?.query;

        // Validate query parameter
        if (!query || typeof query !== 'string') {
          return {
            content: [
              {
                type: 'text',
                text: 'Please provide a query about your Lightning Network channels.',
              },
            ],
            isError: true,
          };
        }

        // Use existing controller with validated parameter
        const result = await this.lightningController.executeQuery(query);

        return {
          content: result.content,
          isError: result.isError,
        };
      } catch (error) {
        logger.error('Tool execution failed', sanitizeError(error));
        const sanitizedError = sanitizeError(error);

        // Return error in a way that can be presented to the user
        return {
          content: [{ type: 'text', text: `Error: ${sanitizedError.message}` }],
          isError: true,
        };
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
    // Create connection details based on connection method
    let connectionDetails: SupportedConnectionDetails;

    if (config.node.connectionMethod === ConnectionMethod.GRPC) {
      connectionDetails = {
        method: ConnectionMethod.GRPC,
        host: config.node.lnd.host,
        port: config.node.lnd.port,
        tlsCertPath: config.node.lnd.tlsCertPath,
        macaroonPath: config.node.lnd.macaroonPath,
      } as LndGrpcDetails;
    } else if (config.node.connectionMethod === ConnectionMethod.LNC) {
      if (!config.node.lnc || !config.node.lnc.connectionString) {
        throw new Error('Missing LNC connection string in configuration');
      }

      connectionDetails = {
        method: ConnectionMethod.LNC,
        connectionString: config.node.lnc.connectionString,
        pairingPhrase: config.node.lnc.pairingPhrase,
      } as LndLncDetails;
    } else {
      throw new Error(`Unsupported connection method: ${config.node.connectionMethod}`);
    }

    // Create the connection using the factory
    return ConnectionFactory.createConnection(config.node.implementation, connectionDetails);
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    logger.error('Failed to create connection from config', {
      error: { message: sanitizedError.message },
    });
    throw sanitizedError;
  }
}
