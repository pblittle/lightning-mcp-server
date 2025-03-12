import { Intent, IntentType } from '../../types/intent';
import logger from '../../utils/logger';

export class IntentParser {
  parseIntent(query: string): Intent {
    logger.info(`Parsing intent from query: "${query}"`);

    if (this.isChannelListQuery(query)) {
      return {
        type: 'channel_list',
        parameters: {},
        originalQuery: query,
      };
    }

    if (this.isChannelHealthQuery(query)) {
      return {
        type: 'channel_health',
        parameters: {},
        originalQuery: query,
      };
    }

    if (this.isChannelLiquidityQuery(query)) {
      return {
        type: 'channel_liquidity',
        parameters: {},
        originalQuery: query,
      };
    }

    return {
      type: 'unknown',
      parameters: {},
      originalQuery: query,
    };
  }

  private isChannelListQuery(query: string): boolean {
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
      /unhealthy channels/i,
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
}
