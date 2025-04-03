/**
 * @fileoverview Lightning MCP controller.
 *
 * Provides an MCP tool for querying Lightning Network data using
 * natural language. This controller handles the MCP protocol and
 * delegates to the LightningQueryProcessor for actual processing.
 */

import { LightningQueryProcessor } from '../../application/processors/LightningQueryProcessor';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';

/**
 * Result of an MCP tool call
 */
export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  // Using a more specific type than 'any'
  data?: Record<string, unknown>;
  isError?: boolean;
}

/**
 * MCP controller for Lightning Network queries
 */
export class LightningMcpController {
  /**
   * Create a new Lightning MCP controller
   * @param queryProcessor The query processor to use
   */
  constructor(private readonly queryProcessor: LightningQueryProcessor) {}

  /**
   * Execute a Lightning Network query
   * @param query The natural language query
   * @returns Promise resolving to the tool result
   */
  public async executeQuery(query: string): Promise<ToolResult> {
    try {
      logger.info('Executing Lightning Network query', {
        component: 'lightning-mcp-controller',
        query,
      });

      // Process the query
      const result = await this.queryProcessor.processQuery(query);

      // Return the result with markdown formatting
      return {
        content: [{ type: 'text', text: result.text }],
        // Using type assertion to ensure compatibility with Record<string, unknown>
        data: result.data as Record<string, unknown>,
      };
    } catch (error) {
      const sanitizedError = sanitizeError(error) || new Error('Unknown error');
      logger.error('Error executing Lightning Network query', sanitizedError, {
        component: 'lightning-mcp-controller',
        query,
      });

      // Return an error result
      return {
        content: [
          {
            type: 'text',
            text: `Error: I couldn't process your query: ${sanitizedError.message}`,
          },
        ],
        data: { error: sanitizedError.message },
        isError: true,
      };
    }
  }
}
