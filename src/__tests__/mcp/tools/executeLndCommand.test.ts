import { jest } from '@jest/globals';
import * as lnService from 'ln-service';
import { ExecuteLndCommandTool } from '../../../mcp/tools/executeLndCommand';
import { LndClient } from '../../../lnd/client';
import { Config } from '../../../config';
import logger from '../../../utils/logger';

// Define types for the ln-service responses that match the expected return types
interface WalletInfoResponse {
  alias: string;
  public_key: string;
  version: string;
  active_channels_count: number;
  peers_count: number;
  block_height: number;
  is_synced_to_chain: boolean;
  is_testnet: boolean;
  chains: string[];
  [key: string]: any;
}

interface PaymentRequestResponse {
  destination: string;
  tokens: number;
  description: string;
  [key: string]: any;
}

interface InvoiceResponse {
  id: string;
  request: string;
  tokens: number;
  [key: string]: any;
}

// Mock dependencies
jest.mock('../../../utils/logger');

// Properly type the mocked ln-service functions
const mockedGetWalletInfo = lnService.getWalletInfo as jest.MockedFunction<
  typeof lnService.getWalletInfo
>;
const mockedDecodePaymentRequest = lnService.decodePaymentRequest as jest.MockedFunction<
  typeof lnService.decodePaymentRequest
>;
const mockedCreateInvoice = lnService.createInvoice as jest.MockedFunction<
  typeof lnService.createInvoice
>;

describe('ExecuteLndCommandTool', () => {
  // Mock LND client
  const mockLnd = { id: 'mock-lnd-instance' };
  const mockClient = {
    getLnd: jest.fn().mockReturnValue(mockLnd),
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

  // Create tool instance
  let tool: ExecuteLndCommandTool;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set environment variable for testing
    process.env.ALLOW_WRITE_COMMANDS = 'false';

    // Create tool instance
    tool = new ExecuteLndCommandTool(mockClient, mockConfig);
  });

  afterEach(() => {
    // Reset environment variables
    delete process.env.ALLOW_WRITE_COMMANDS;
  });

  describe('constructor', () => {
    test('should initialize with default settings', () => {
      expect(tool).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        { allowWriteCommands: false },
        'ExecuteLndCommandTool initialized'
      );
    });

    test('should respect ALLOW_WRITE_COMMANDS environment variable', () => {
      // Set environment variable
      process.env.ALLOW_WRITE_COMMANDS = 'true';

      // Create new instance and trigger constructor
      new ExecuteLndCommandTool(mockClient, mockConfig);

      expect(logger.info).toHaveBeenCalledWith(
        { allowWriteCommands: true },
        'ExecuteLndCommandTool initialized'
      );
    });
  });

  describe('getAllowedCommands', () => {
    test('should return a list of allowed commands', () => {
      const commands = tool.getAllowedCommands();

      expect(commands).toBeInstanceOf(Array);
      expect(commands.length).toBeGreaterThan(0);

      // Check structure of command objects
      commands.forEach((command) => {
        expect(command).toHaveProperty('name');
        expect(command).toHaveProperty('description');
        expect(command).toHaveProperty('isWriteCommand');
      });
    });
  });

  describe('executeCommand', () => {
    test('should execute a valid read-only command', async () => {
      // Mock ln-service getWalletInfo with proper typing
      const mockResponse: WalletInfoResponse = {
        alias: 'test-node',
        public_key: 'test-pubkey',
        version: '0.15.1',
        active_channels_count: 5,
        peers_count: 10,
        block_height: 700000,
        is_synced_to_chain: true,
        is_testnet: false,
        chains: ['bitcoin'],
      };
      mockedGetWalletInfo.mockResolvedValueOnce(mockResponse);

      // Execute command
      const result = await tool.executeCommand('getWalletInfo');

      // Verify ln-service was called correctly
      expect(mockClient.getLnd).toHaveBeenCalled();
      expect(mockedGetWalletInfo).toHaveBeenCalledWith({ lnd: mockLnd });

      // Verify result
      expect(result).toContain('test-node');
      expect(result).toContain('test-pubkey');

      // Verify logging
      expect(logger.debug).toHaveBeenCalled();
    });

    test('should execute a command with parameters', async () => {
      // Mock ln-service decodePaymentRequest with proper typing
      const mockResponse: PaymentRequestResponse = {
        destination: 'test-destination',
        tokens: 1000,
        description: 'Test payment',
      };
      mockedDecodePaymentRequest.mockResolvedValueOnce(mockResponse);

      // Execute command with parameters
      const result = await tool.executeCommand('decodePaymentRequest', {
        request: 'lnbc1000...',
      });

      // Verify ln-service was called correctly
      expect(mockClient.getLnd).toHaveBeenCalled();
      expect(mockedDecodePaymentRequest).toHaveBeenCalledWith({
        lnd: mockLnd,
        request: 'lnbc1000...',
      });

      // Verify result
      expect(result).toContain('test-destination');
      expect(result).toContain('1000');
    });

    test('should reject disallowed commands', async () => {
      // Attempt to execute a write command when not allowed
      await expect(tool.executeCommand('createInvoice', { tokens: 1000 })).rejects.toThrow(
        'not allowed'
      );

      // Verify ln-service was not called
      expect(mockedCreateInvoice).not.toHaveBeenCalled();

      // Verify error logging
      expect(logger.error).toHaveBeenCalled();
    });

    test('should allow write commands when enabled', async () => {
      // Set environment variable
      process.env.ALLOW_WRITE_COMMANDS = 'true';

      // Create new instance with write commands enabled
      const writeTool = new ExecuteLndCommandTool(mockClient, mockConfig);

      // Mock ln-service createInvoice with proper typing
      const mockResponse: InvoiceResponse = {
        id: 'invoice-id',
        request: 'lnbc1000...',
        tokens: 1000,
      };
      mockedCreateInvoice.mockResolvedValueOnce(mockResponse);

      // Execute write command
      const result = await writeTool.executeCommand('createInvoice', { tokens: 1000 });

      // Verify ln-service was called correctly
      expect(mockClient.getLnd).toHaveBeenCalled();
      expect(mockedCreateInvoice).toHaveBeenCalledWith({
        lnd: mockLnd,
        tokens: 1000,
      });

      // Verify result
      expect(result).toContain('invoice-id');
      expect(result).toContain('lnbc1000');
    });

    test('should validate parameters', async () => {
      // Attempt to execute with invalid parameters
      await expect(tool.executeCommand('decodePaymentRequest', {})).rejects.toThrow(
        'Required parameter'
      );

      // Verify ln-service was not called
      expect(mockedDecodePaymentRequest).not.toHaveBeenCalled();

      // Verify error logging
      expect(logger.error).toHaveBeenCalled();
    });

    test('should handle ln-service errors', async () => {
      // Mock ln-service to throw an error with proper typing
      mockedGetWalletInfo.mockRejectedValueOnce(new Error('Connection failed'));

      // Attempt to execute command
      await expect(tool.executeCommand('getWalletInfo')).rejects.toThrow('Connection failed');

      // Verify error logging
      expect(logger.error).toHaveBeenCalled();
    });

    test('should reject unknown commands', async () => {
      // Attempt to execute an unknown command
      await expect(tool.executeCommand('unknownCommand')).rejects.toThrow('not allowed');

      // Verify error logging
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
