import { Intent, IntentType } from '../entities/Intent';
import { IntentSchema } from '../schemas/intent';
import { validateWithZod } from '../../../core/validation/zod-validators';
import logger from '../../../core/logging/logger';
import { sanitizeError } from '../../../core/errors/sanitize';

/**
 * IntentParser analyzes natural language queries and classifies them into structured intents.
 *
 * This service is a key component in the NLP pipeline that bridges user queries with
 * the appropriate domain operations. It uses pattern matching to identify the user's intent,
 * then constructs a validated Intent object that downstream handlers can use.
 */
export class IntentParser {
  /**
   * Parses a natural language query into a structured intent object
   * with validation using Zod schemas.
   *
   * The parsing follows a hierarchical, priority-based approach:
   * 1. First checks for unhealthy channels queries (most specific)
   * 2. Then checks for channel health queries (more general health concerns)
   * 3. Then checks for channel liquidity queries
   * 4. Finally checks for general channel listing queries (most generic)
   *
   * This order ensures that more specific intents are matched before more general ones.
   * If no patterns match, the intent type defaults to "unknown".
   *
   * @param query Natural language query to parse
   * @returns Validated Intent object with type and original query
   */
  parseIntent(query: string): Intent {
    try {
      let type: IntentType = 'unknown';

      // Add debug logging at the start
      logger.debug('Parsing user intent', {
        component: 'intent-parser',
        query: query,
      });

      // Check in order of specificity to avoid incorrect categorization
      if (this.isUnhealthyChannelsQuery(query)) {
        type = 'channel_unhealthy';
      } else if (this.isChannelHealthQuery(query)) {
        type = 'channel_health';
      } else if (this.isChannelLiquidityQuery(query)) {
        type = 'channel_liquidity';
      } else if (this.isChannelListQuery(query)) {
        type = 'channel_list';
      }

      // Construct and validate the intent object using Zod
      const intent = validateWithZod(IntentSchema, { type, query });

      // Log the result
      logger.info('Intent parsed successfully', {
        component: 'intent-parser',
        query: query,
        intentType: type,
      });

      return intent;
    } catch (error) {
      // Enhanced error logging with sanitization
      const sanitizedError = sanitizeError(error);
      logger.error('Failed to parse intent', {
        component: 'intent-parser',
        query: query,
        error: sanitizedError.message,
      });

      // Return a validated unknown intent with error
      return validateWithZod(IntentSchema, {
        type: 'unknown',
        query,
        error: sanitizedError,
      });
    }
  }

  /**
   * Determines if a query is requesting a list of channels.
   *
   * This is the most general intent and matches queries about viewing
   * or listing channels. It specifically excludes unhealthy channel queries
   * which are handled by a more specific intent matcher.
   *
   * Example matches:
   * - "show me my channels"
   * - "list all channels"
   * - "what channels do I have"
   * - "channel list"
   *
   * @param query The natural language query to analyze
   * @returns Whether the query is asking for a channel list
   */
  private isChannelListQuery(query: string): boolean {
    // Make sure we specifically exclude unhealthy channels queries from matching as list queries
    if (this.isUnhealthyChannelsQuery(query)) {
      return false;
    }

    const patterns = [
      /show (me |my |all )*channels/i,
      /list (me |my |all )*channels/i,
      /what channels/i,
      /channel list/i,
      /all channels/i,
    ];

    return patterns.some((pattern) => pattern.test(query));
  }

  /**
   * Determines if a query is asking about channel health status.
   *
   * This intent covers general health and status inquiries about channels,
   * focusing on operational state rather than specific issues.
   *
   * Example matches:
   * - "channel health"
   * - "inactive channels"
   * - "channel issues"
   * - "problematic channels"
   *
   * @param query The natural language query to analyze
   * @returns Whether the query is asking about channel health
   */
  private isChannelHealthQuery(query: string): boolean {
    const patterns = [
      /channel (status|health)/i,
      /(inactive|active) channels/i,
      /problematic channels/i,
      /channel (issues|problems)/i,
    ];

    return patterns.some((pattern) => pattern.test(query));
  }

  /**
   * Determines if a query is asking about channel liquidity or balances.
   *
   * This intent focuses on financial aspects of channels, particularly
   * the distribution of funds and capacity allocation.
   *
   * Example matches:
   * - "channel balance"
   * - "imbalanced channels"
   * - "local balance"
   * - "liquidity distribution"
   * - "channel capacity"
   *
   * @param query The natural language query to analyze
   * @returns Whether the query is asking about channel liquidity
   */
  private isChannelLiquidityQuery(query: string): boolean {
    const patterns = [
      /channel (balance|liquidity)/i,
      /imbalanced channels/i,
      /(local|remote) balance/i,
      /liquidity distribution/i,
      /channel capacity/i,
    ];

    return patterns.some((pattern) => pattern.test(query));
  }

  /**
   * Determines if a query is specifically asking about unhealthy channels.
   *
   * This is the most specific intent and takes priority over other matchers.
   * It identifies queries focused on channels that are experiencing problems
   * or require operator attention.
   *
   * Example matches:
   * - "show unhealthy channels"
   * - "channels that need attention"
   * - "broken channels"
   * - "inactive channels"
   * - "channels with issues"
   *
   * @param query The natural language query to analyze
   * @returns Whether the query is asking about unhealthy channels
   */
  private isUnhealthyChannelsQuery(query: string): boolean {
    const patterns = [
      /show unhealthy channels/i,
      /unhealthy channels/i,
      /problematic channels/i,
      /channels (that need|needing|requiring) attention/i,
      /broken channels/i,
      /inactive channels/i,
      /channels (with|having) (issues|problems)/i,
    ];

    return patterns.some((pattern) => pattern.test(query));
  }
}
