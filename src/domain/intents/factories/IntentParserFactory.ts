/**
 * @fileoverview Factory for creating intent parser strategies.
 *
 * This factory creates the appropriate intent parser strategy based on
 * configuration or other criteria. It encapsulates the creation logic
 * and allows for easy switching between different strategies.
 */

import { IntentParserStrategy } from '../strategies/IntentParserStrategy';
import { RegexIntentParser } from '../strategies/RegexIntentParser';
import { Config } from '../../../core/config';

/**
 * Factory for creating intent parser strategies
 */
export class IntentParserFactory {
  /**
   * Create an intent parser strategy based on configuration
   * @param config Application configuration
   * @returns An intent parser strategy
   */
  static createParser(_config?: Config): IntentParserStrategy {
    // For now, we only have one strategy
    return new RegexIntentParser();

    // In the future, we can add more strategies based on configuration
    // if (config?.nlp?.strategy === 'advanced') {
    //   return new AdvancedIntentParser();
    // }
  }
}
