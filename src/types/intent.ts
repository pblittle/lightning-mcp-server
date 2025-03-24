/**
 * Types of channel queries supported
 */
export type IntentType =
  | 'channel_list'
  | 'channel_health'
  | 'channel_liquidity'
  | 'channel_unhealthy'
  | 'unknown';

/**
 * Query intent with parameters
 */
export interface Intent {
  type: IntentType;
  query: string;
  error?: Error;
}

/**
 * Query result with natural language response and data
 */
export interface QueryResult {
  data: Record<string, any>;
  type?: string;
  response?: string;
}
