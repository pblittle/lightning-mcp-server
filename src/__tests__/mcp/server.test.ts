import { jest } from '@jest/globals';
import * as lnService from 'ln-service';
import { McpServer, createMcpServer } from '../../mcp/server';
import { LndClient } from '../../lnd/client';
import { Config } from '../../config';
import logger from '../../utils/logger';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('McpServer', () => {
  // Mock LND client
  const mockLnd = { id: 'mock-lnd-instance' };
  const mockClient = {
    getLnd: jest.fn().mockReturnValue(mockLnd),
    checkConnection: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  } as unknown as LndClient;

  // Mock config
  const mockConfig: Config = {
    lnd: {
      tlsCertPath: '/path/to/tls.cert',
      macaroonPath: '/path/to/macaroon',
      host: 'localhost',
      port: '10009',
    },
    server: {
      port: 3000,
    },
  };

  // Mock MCP SDK
  const mockSetRequestHandler = jest.fn();
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockClose = jest.fn().mockResolvedValue(undefined);

  // Mock server instance
  let server: McpServer;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Server constructor
    (Server as jest.Mock).mockImplementation(() => ({
      setRequestHandler: mockSetRequestHandler,
      connect: mockConnect,
      close: mockClose,
      onerror: jest.fn(),
    }));

    // Mock StdioServerTransport
    (StdioServerTransport as jest.Mock).mockImplementation(() => ({
      id: 'mock-transport',
    }));

    // Create server instance
    server = new McpServer(mockClient, mockConfig);
  });

  describe('constructor', () => {
    test('should initialize the server correctly', () => {
      expect(server).toBeDefined();
      expect(Server).toHaveBeenCalledWith(
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
      expect(mockSetRequestHandler).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith('MCP server initialized');
    });
  });

  describe('start', () => {
    test('should start the server correctly', async () => {
      await server.start();

      expect(mockClient.checkConnection).toHaveBeenCalled();
      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('MCP server started');
    });

    test('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      // Type assertion to access Jest mock methods
      (mockClient.checkConnection as jest.Mock).mockRejectedValueOnce(error);

      await expect(server.start()).rejects.toThrow('Connection failed');
      expect(logger.fatal).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    test('should stop the server correctly', async () => {
      await server.stop();

      expect(mockClose).toHaveBeenCalled();
      expect(mockClient.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('MCP server stopped');
    });

    test('should handle errors during shutdown', async () => {
      const error = new Error('Shutdown failed');
      // Type assertion to access Jest mock methods
      (mockClose as jest.Mock).mockRejectedValueOnce(error);

      await server.stop();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('createMcpServer', () => {
    test('should create and start a server', async () => {
      const startSpy = jest.spyOn(McpServer.prototype, 'start').mockResolvedValueOnce();

      const result = await createMcpServer(mockClient, mockConfig);

      expect(result).toBeInstanceOf(McpServer);
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('request handlers', () => {
    test('should register ListTools handler', () => {
      expect(mockSetRequestHandler).toHaveBeenCalledWith(
        ListToolsRequestSchema,
        expect.any(Function)
      );
    });

    test('should register CallTool handler', () => {
      expect(mockSetRequestHandler).toHaveBeenCalledWith(
        CallToolRequestSchema,
        expect.any(Function)
      );
    });

    test('should handle ListTools requests', async () => {
      // Find the ListTools handler
      const handlerCall = mockSetRequestHandler.mock.calls.find(
        (call) => call[0] === ListToolsRequestSchema
      );

      if (!handlerCall) {
        throw new Error('ListTools handler not found');
      }

      const listToolsHandler = handlerCall[1] as Function;

      // Call the handler
      const result = await listToolsHandler();

      // Verify the result
      expect(result).toHaveProperty('tools');
      expect(result.tools).toBeInstanceOf(Array);
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.tools[0]).toHaveProperty('name', 'queryChannels');
    });

    test('should handle CallTool requests for queryChannels', async () => {
      // Mock getChannels to return a result
      (lnService.getChannels as jest.Mock).mockResolvedValueOnce({
        channels: [
          {
            capacity: 1000000,
            local_balance: 500000,
            remote_balance: 500000,
            active: true,
            remote_pubkey: 'test-pubkey',
          },
        ],
      });

      // Find the CallTool handler
      const handlerCall = mockSetRequestHandler.mock.calls.find(
        (call) => call[0] === CallToolRequestSchema
      );

      if (!handlerCall) {
        throw new Error('CallTool handler not found');
      }

      const callToolHandler = handlerCall[1] as Function;

      // Call the handler with a valid request
      const result = await callToolHandler({
        params: {
          name: 'queryChannels',
          arguments: {
            query: 'Show me all my channels',
          },
        },
      });

      // Verify the result
      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    test('should handle errors in CallTool requests', async () => {
      // Find the CallTool handler
      const handlerCall = mockSetRequestHandler.mock.calls.find(
        (call) => call[0] === CallToolRequestSchema
      );

      if (!handlerCall) {
        throw new Error('CallTool handler not found');
      }

      const callToolHandler = handlerCall[1] as Function;

      // Call the handler with an invalid request
      await expect(
        callToolHandler({
          params: {
            name: 'unknownTool',
            arguments: {},
          },
        })
      ).rejects.toThrow('Unknown tool');
    });

    test('should validate query parameter in queryChannels', async () => {
      // Find the CallTool handler
      const handlerCall = mockSetRequestHandler.mock.calls.find(
        (call) => call[0] === CallToolRequestSchema
      );

      if (!handlerCall) {
        throw new Error('CallTool handler not found');
      }

      const callToolHandler = handlerCall[1] as Function;

      // Call the handler with a missing query
      await expect(
        callToolHandler({
          params: {
            name: 'queryChannels',
            arguments: {},
          },
        })
      ).rejects.toThrow('Missing or invalid query parameter');
    });
  });
});
