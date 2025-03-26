import { ChannelService } from '../../domain/channels/services/ChannelService';
import { IntentParser } from '../../domain/intents/services/IntentParser';
import { ChannelQueryHandler } from '../../application/queries/ChannelQueryHandler';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';

/**
 * Interface for MCP tool result
 *
 * This represents the standardized response format for tool execution.
 * The structure aligns with the MCP protocol expectations.
 */
interface ToolResult {
  response: string;
  data: Record<string, unknown>;
  _meta: {
    type: string;
    error?: string;
  };
}

/**
 * Tool for querying Lightning Network channels using natural language
 */
export class ChannelQueryTool {
  private readonly name = 'queryChannels';
  private readonly description = 'Query Lightning Network channels using natural language';
  private intentParser: IntentParser;
  private queryHandler: ChannelQueryHandler;

  constructor(channelService: ChannelService) {
    this.intentParser = new IntentParser();
    this.queryHandler = new ChannelQueryHandler(channelService);
  }

  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language query about your Lightning Node channels',
          },
        },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          response: {
            type: 'string',
            description: 'Natural language response to your query',
          },
          data: {
            type: 'object',
            description: 'Structured data related to your query',
          },
        },
      },
    };
  }

  public async executeQuery(query: string): Promise<ToolResult> {
    try {
      logger.info(`Received query: "${query}"`);

      // Parse the query to determine intent
      const intent = this.intentParser.parseIntent(query);

      // Handle the query based on the intent
      const result = await this.queryHandler.handleQuery(intent);

      logger.info(`Query handled successfully: "${query}"`);

      // Format the result to match MCP SDK expected structure
      return {
        response: result.response,
        data: result.data,
        _meta: {
          type: result.type || 'channel_query',
        },
      };
    } catch (error) {
      const sanitizedError = sanitizeError(error);
      logger.error(`Error executing query: ${sanitizedError.message}`);

      return {
        response: `I encountered an error while processing your query: ${sanitizedError.message}`,
        data: {},
        _meta: {
          type: 'error',
          error: sanitizedError.message,
        },
      };
    }
  }
}
