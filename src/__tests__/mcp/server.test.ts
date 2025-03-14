/**
 * Test implementation of MCP server
 */
import logger from '../../utils/logger';

/**
 * MCP server configuration options
 */
export interface McpServerConfig {
  readonly port?: number;
  readonly host?: string;
  readonly transport?: 'http' | 'stdio' | 'websocket';
}

/**
 * Mock implementation of MCP server for testing
 */
export class McpServer {
  private isRunning = false;

  /**
   * Creates a new MCP server instance
   */
  constructor(private readonly config: McpServerConfig) {
    logger.debug('Created MCP server with config:', config);
  }

  /**
   * Starts the MCP server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('MCP server already running');
      return;
    }

    logger.info('Starting MCP server');
    this.isRunning = true;

    return Promise.resolve();
  }

  /**
   * Stops the MCP server
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('MCP server not running');
      return;
    }

    logger.info('Stopping MCP server');
    this.isRunning = false;

    return Promise.resolve();
  }

  /**
   * Returns whether the server is running
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }
}
