/**
 * @fileoverview Intent parser strategy interface.
 *
 * Defines the strategy pattern interface for parsing natural language
 * queries into structured intents. This allows for different parsing
 * implementations to be swapped out without affecting the rest of the system.
 */

import { EnhancedIntent } from '../entities/EnhancedIntent';

/**
 * Strategy interface for intent parsing
 *
 * This interface defines the contract for intent parsers, allowing
 * different implementations to be used interchangeably.
 */
export interface IntentParserStrategy {
  /**
   * Parse a natural language query into a structured intent
   * @param query The natural language query to parse
   * @returns A structured intent object
   */
  parseIntent(query: string): EnhancedIntent;
}
