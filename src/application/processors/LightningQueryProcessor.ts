/**
 * @fileoverview Lightning query processor.
 *
 * Orchestrates the flow of processing a natural language query about
 * Lightning Network data. This includes parsing the intent, executing
 * the appropriate handler, and formatting the response.
 */

import { IntentParserStrategy } from '../../domain/intents/strategies/IntentParserStrategy';
import { DomainHandlerRegistry } from '../../domain/handlers/DomainHandlerRegistry';
import { EnhancedIntent } from '../../domain/intents/entities/EnhancedIntent';
import logger from '../../core/logging/logger';
import { sanitizeError } from '../../core/errors/sanitize';
import { ChannelQueryResult } from '../../domain/handlers/ChannelDomainHandler';

/**
 * Response from a Lightning Network query
 */
export interface QueryResponse {
  text: string;
  data: ChannelQueryResult | { error: string };
  intent: EnhancedIntent;
}

/**
 * Processor for Lightning Network queries
 */
export class LightningQueryProcessor {
  /**
   * Create a new Lightning query processor
   * @param intentParser The intent parser to use
   * @param handlerRegistry The domain handler registry to use
   */
  constructor(
    private readonly intentParser: IntentParserStrategy,
    private readonly handlerRegistry: DomainHandlerRegistry
  ) {}

  /**
   * Process a natural language query
   * @param query The query to process
   * @returns Promise resolving to the query response
   */
  async processQuery(query: string): Promise<QueryResponse> {
    try {
      logger.info('Processing Lightning Network query', {
        component: 'lightning-query-processor',
        query,
      });

      // Parse the intent
      const intent = this.intentParser.parseIntent(query);
      logger.debug('Intent parsed', {
        component: 'lightning-query-processor',
        domain: intent.domain,
        operation: intent.operation,
      });

      // Get the appropriate handler
      const handler = this.handlerRegistry.getHandlerForIntent(intent);
      logger.debug('Handler found', {
        component: 'lightning-query-processor',
        handlerType: handler.constructor.name,
      });

      // Execute the handler
      const result = await handler.handle(intent);
      logger.debug('Handler executed', {
        component: 'lightning-query-processor',
        resultType: typeof result,
      });

      // Extract the formatted text from the result
      let text = '';
      if (result.formattedResults) {
        const operation = intent.operation;
        // Use operation-specific format if available, otherwise fallback to list
        if (operation === 'liquidity' && result.formattedResults.liquidity) {
          text = result.formattedResults.liquidity;
        } else if (result.formattedResults.list) {
          text = result.formattedResults.list;
        }
      }

      // If we don't have formatted text, use a generic response
      if (!text) {
        text = `I found information about ${result.channels?.length || 0} channels.`;
      }

      // Return the response
      return {
        text,
        data: result,
        intent,
      };
    } catch (error) {
      const sanitizedError = sanitizeError(error) || new Error('Unknown error');
      logger.error('Error processing query', sanitizedError, {
        component: 'lightning-query-processor',
        query,
      });

      // Return an error response
      return {
        text: `Sorry, I couldn't process your query: ${sanitizedError.message}`,
        data: { error: sanitizedError.message },
        intent: {
          domain: 'unknown',
          operation: 'unknown',
          attributes: new Map(),
          query,
          error: sanitizedError,
        },
      };
    }
  }
}
