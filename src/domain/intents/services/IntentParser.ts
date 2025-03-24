import { Intent, IntentType } from '../entities/Intent';
import { IntentSchema } from '../schemas/intent';
import { validateWithZod } from '../../../core/validation/zod-validators';
import logger from '../../../core/logging/logger';
import { sanitizeError } from '../../../core/errors/sanitize';

export class IntentParser {
  /**
   * Parses a natural language query into a structured intent object
   * with validation using Zod schemas.
   *
   * @param query Natural language query to parse
   * @returns Validated Intent object
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

  private isChannelHealthQuery(query: string): boolean {
    const patterns = [
      /channel (status|health)/i,
      /(inactive|active) channels/i,
      /problematic channels/i,
      /channel (issues|problems)/i,
    ];

    return patterns.some((pattern) => pattern.test(query));
  }

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
