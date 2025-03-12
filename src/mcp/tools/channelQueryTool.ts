import { McpTool } from '@modelcontextprotocol/sdk';
import { LndClient } from '../../lnd/client';
import { IntentParser } from '../nlp/intentParser';
import { ChannelQueryHandler } from '../handlers/channelQueryHandler';
import logger from '../../utils/logger';

export class ChannelQueryTool implements McpTool {
  private readonly name = 'queryChannels';
  private readonly description = 'Query Lightning Network channels using natural language';
  private intentParser: IntentParser;
  private queryHandler: ChannelQueryHandler;

  constructor(private readonly lndClient: LndClient) {
    this.intentParser = new IntentParser();
    this.queryHandler = new ChannelQueryHandler(lndClient);
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

  async executeQuery(query: string): Promise<{ response: string; data: Record<string, any> }> {
    try {
      logger.info(`Received query: "${query}"`);

      // Parse the query to determine intent
      const intent = this.intentParser.parseIntent(query);

      // Handle the query based on the intent
      const result = await this.queryHandler.handleQuery(intent);

      logger.info(`Query handled successfully: "${query}"`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error executing query: ${errorMessage}`);

      return {
        response: `I encountered an error while processing your query: ${errorMessage}`,
        data: {},
      };
    }
  }
}
