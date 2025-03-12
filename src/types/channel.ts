import { Channel as LnServiceChannel } from 'ln-service';

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
