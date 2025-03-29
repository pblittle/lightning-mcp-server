/**
 * @fileoverview Regex-based implementation of the intent parser strategy.
 *
 * This implementation uses regular expressions to parse natural language
 * queries into structured intents. It's a simple but effective approach
 * for a limited domain of queries.
 */

import { IntentParserStrategy } from './IntentParserStrategy';
import {
  EnhancedIntent,
  LightningDomain,
  LightningOperation,
  createIntent,
  createUnknownIntent,
} from '../entities/EnhancedIntent';
import logger from '../../../core/logging/logger';
import { sanitizeError } from '../../../core/errors/sanitize';

/**
 * Regex-based implementation of the intent parser strategy
 *
 * This implementation uses regular expressions to identify the domain
 * and operation of a query. It's a simple but effective approach for
 * a limited domain of queries.
 */
export class RegexIntentParser implements IntentParserStrategy {
  /**
   * Parse a natural language query into a structured intent
   * @param query The natural language query to parse
   * @returns A structured intent object
   */
  parseIntent(query: string): EnhancedIntent {
    try {
      logger.debug('Parsing user intent with regex strategy', {
        component: 'regex-intent-parser',
        query,
      });

      // First determine the domain (channels, nodes, etc.)
      const domain = this.determineDomain(query);

      // Then determine the operation based on the domain
      const operation = this.determineOperation(query, domain);

      // Extract any attributes or constraints
      const attributes = this.extractAttributes(query, domain, operation);

      // Create the intent
      const intent = createIntent(domain, operation, query, attributes);

      logger.info('Intent parsed successfully', {
        component: 'regex-intent-parser',
        query,
        domain,
        operation,
      });

      return intent;
    } catch (error) {
      const sanitizedError = sanitizeError(error) || new Error('Unknown error');
      logger.error('Failed to parse intent', sanitizedError, {
        component: 'regex-intent-parser',
        query,
      });

      return createUnknownIntent(query, sanitizedError);
    }
  }

  /**
   * Determine the domain of a query
   *
   * Note: Currently only the 'channels' domain is implemented.
   * This method is structured to support additional domains in the future
   * or when transitioning to a more advanced NLP solution.
   *
   * @param query The query to analyze
   * @returns The domain of the query (currently always 'channels')
   * @private
   */
  private determineDomain(_query: string): LightningDomain {
    // Currently only the 'channels' domain is supported
    // When additional domains are added, this method should be expanded
    // to properly detect and route to those domains
    return 'channels';
  }

  /**
   * Determine the operation for a query in a given domain
   * @param query The query to analyze
   * @param domain The domain of the query
   * @returns The operation to perform
   * @private
   */
  private determineOperation(query: string, domain: LightningDomain): LightningOperation {
    const lowerQuery = query.toLowerCase();

    // For channel domain
    if (domain === 'channels') {
      // Check for liquidity-related queries
      if (
        lowerQuery.includes('liquidity') ||
        lowerQuery.includes('balance') ||
        lowerQuery.includes('capacity') ||
        lowerQuery.includes('fund')
      ) {
        return 'liquidity';
      }

      // All other channel queries are treated as list operations
      // This includes previously "health"-related terms
      // Specific filtering is handled via attributes
      return 'list';
    }

    // Default to list for unknown domains
    return 'list';
  }

  /**
   * Extract attributes and constraints from a query
   * @param query The query to analyze
   * @param domain The domain of the query
   * @param operation The operation to perform
   * @returns Map of attributes and constraints
   * @private
   */
  private extractAttributes(
    query: string,
    domain: LightningDomain,
    operation: LightningOperation
  ): Map<string, unknown> {
    const attributes = new Map<string, unknown>();
    const lowerQuery = query.toLowerCase();

    // Extract active/inactive filter for channels
    if (domain === 'channels') {
      if (lowerQuery.includes('inactive')) {
        // Check for 'inactive' first since it contains 'active'
        attributes.set('active', false);
      } else if (lowerQuery.includes('active')) {
        attributes.set('active', true);
      }

      // Extract balance threshold for liquidity queries
      if (operation === 'liquidity' && lowerQuery.includes('imbalanced')) {
        attributes.set('checkBalance', true);
      }
    }

    return attributes;
  }
}
