/**
 * Types of channel queries supported
 */
export type IntentType = 'channel_list' | 'channel_health' | 'channel_liquidity' | 'unknown';

/**
 * Query intent with parameters
 */
export interface Intent {
  type: IntentType;
  parameters: Record<string, string | number | boolean>;
  originalQuery: string;
}

/**
 * Query result with natural language response and data
 */
export interface QueryResult {
  response: string;
  data: Record<string, any>;
}
