/**
 * @fileoverview Domain handler interface.
 *
 * Defines the interface for domain-specific handlers that process
 * intents for a particular domain (channels, nodes, etc.).
 */

import { EnhancedIntent } from '../intents/entities/EnhancedIntent';
import { ChannelQueryResult } from './ChannelDomainHandler';

/**
 * Interface for domain-specific handlers
 */
export interface DomainHandler {
  /**
   * Handle an intent for this domain
   * @param intent The intent to handle
   * @returns Promise resolving to the result of handling the intent
   */
  handle(intent: EnhancedIntent): Promise<ChannelQueryResult>;

  /**
   * Check if this handler can handle the given intent
   * @param intent The intent to check
   * @returns Whether this handler can handle the intent
   */
  canHandle(intent: EnhancedIntent): boolean;
}
