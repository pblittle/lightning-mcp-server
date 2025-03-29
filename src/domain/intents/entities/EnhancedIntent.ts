/**
 * @fileoverview Enhanced Intent model for Lightning Network queries.
 *
 * Defines a flexible, extensible intent model that can represent
 * various types of Lightning Network queries across different domains.
 */

/**
 * Domain types for Lightning Network queries
 */
export type LightningDomain =
  | 'channels'
  | 'nodes'
  | 'transactions'
  | 'wallet'
  | 'invoices'
  | 'payments'
  | 'forwards'
  | 'peers'
  | 'unknown';

/**
 * Operation types for Lightning Network queries
 */
export type LightningOperation = 'list' | 'details' | 'summary' | 'liquidity' | 'unknown';

/**
 * Enhanced Intent model for Lightning Network queries
 *
 * This model provides a flexible structure for representing user intents
 * across different Lightning Network domains and operations.
 */
export interface EnhancedIntent {
  /**
   * Primary domain of the query (channels, nodes, etc.)
   */
  domain: LightningDomain;

  /**
   * Operation to perform (list, details, summary, etc.)
   */
  operation: LightningOperation;

  /**
   * Attributes and constraints for the query
   */
  attributes: Map<string, any>;

  /**
   * Original query string
   */
  query: string;

  /**
   * Optional error information
   */
  error?: Error;
}

/**
 * Create a new enhanced intent
 * @param domain Primary domain of the query
 * @param operation Operation to perform
 * @param query Original query string
 * @param attributes Optional attributes and constraints
 * @param error Optional error information
 * @returns Enhanced intent object
 */
export function createIntent(
  domain: LightningDomain,
  operation: LightningOperation,
  query: string,
  attributes: Map<string, any> = new Map(),
  error?: Error
): EnhancedIntent {
  return {
    domain,
    operation,
    attributes,
    query,
    error,
  };
}

/**
 * Create an unknown intent with optional error
 * @param query Original query string
 * @param error Optional error information
 * @returns Unknown intent object
 */
export function createUnknownIntent(query: string, error?: Error): EnhancedIntent {
  return createIntent('unknown', 'unknown', query, new Map(), error);
}
