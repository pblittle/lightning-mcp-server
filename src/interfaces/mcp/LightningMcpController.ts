/**
 * @fileoverview Lightning MCP controller.
 *
 * Provides an MCP tool for querying Lightning Network data using
 * natural language. This controller handles the MCP protocol and
 * delegates to the LightningQueryProcessor for actual processing.
 */

import { LightningQueryProcessor } from '../../application/processors/LightningQueryProcessor';
import logger from '../../core/logging/logger';
import { sanitizeError, sanitizeForLogging } from '../../core/errors/sanitize';
import { BaseError } from '../../core/errors/base-error';

/**
 * Result of an MCP tool call
 * Used by McpServer to format tool call responses
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
    const requestId = crypto.randomUUID();

    try {
      logger.info('Executing Lightning Network query', {
        component: 'lightning-mcp-controller',
        requestId,
        query,
      });

      // Process the query
      const result = await this.queryProcessor.processQuery(query);

      // Sanitize result data for logging
      const sanitizedData = sanitizeForLogging(result.data);

      // Log successful execution
      logger.info('Successfully processed query', {
        requestId,
        component: 'lightning-mcp-controller',
        intentDomain: result.intent.domain,
        intentOperation: result.intent.operation,
        resultData: sanitizedData,
      });

      // Return the result with markdown formatting
      return {
        content: [{ type: 'text', text: result.text }],
        // Using type assertion to ensure compatibility with Record<string, unknown>
        data: result.data as Record<string, unknown>,
        isError: false,
      };
    } catch (error) {
      // Always sanitize errors before logging or returning them
      const sanitizedError = sanitizeError(error);

      // Enhanced error logging with more context
      logger.error('Error executing Lightning Network query', sanitizedError, {
        component: 'lightning-mcp-controller',
        requestId,
        query,
        errorType: sanitizedError.name,
        // Include error code if it's a BaseError
        errorCode: error instanceof BaseError ? error.code : undefined,
      });

      // Return an error result with enhanced error information
      if (error instanceof BaseError) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${sanitizedError.message}`,
            },
          ],
          data: {
            error: sanitizedError.message,
            code: error.code, // Preserve error code for downstream handling
          },
          isError: true,
        };
      } else {
        // Return a more generic error result
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
}
