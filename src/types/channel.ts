import { Channel as LnServiceChannel } from 'ln-service';

/**
 * Health criteria for channels
 * Defines thresholds for determining channel health
 */
export interface HealthCriteria {
  /**
   * Minimum acceptable local balance ratio (0.0 to 1.0)
   * Channels with local balance ratio below this are considered unhealthy
   */
  minLocalRatio: number;

  /**
   * Maximum acceptable local balance ratio (0.0 to 1.0)
   * Channels with local balance ratio above this are considered unhealthy
   */
  maxLocalRatio: number;
}

/**
 * Lightning Network Channel
 * Extends ln-service Channel type with additional fields
 */
export interface Channel extends LnServiceChannel {
  remote_alias?: string;
}

/**
 * Channel Summary Statistics
 */
export interface ChannelSummary {
  totalCapacity: number;
  totalLocalBalance: number;
  totalRemoteBalance: number;
  activeChannels: number;
  inactiveChannels: number;
  averageCapacity: number;
  mostImbalancedChannel?: Channel;
  healthyChannels: number;
  unhealthyChannels: number;
}

/**
 * Channel Query Result
 */
export interface ChannelQueryResult {
  channels: Channel[];
  summary: ChannelSummary;
}

/**
 * Channel Query Response
 */
export interface ChannelQueryResponse {
  response: string;
  data: ChannelQueryResult;
}
