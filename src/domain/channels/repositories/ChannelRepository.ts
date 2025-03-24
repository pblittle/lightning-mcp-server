import { Channel } from '../entities/Channel';

/**
 * Repository interface for accessing channel data
 */
export interface ChannelRepository {
  /**
   * Fetch all channels from the LND node
   */
  getChannels(): Promise<Channel[]>;

  /**
   * Fetch node alias information for a remote node
   * @param pubkey The public key of the remote node
   */
  getNodeAlias(pubkey: string): Promise<string | undefined>;
}
