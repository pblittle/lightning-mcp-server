// src/mcp/formatters/channelFormatter.ts
import { ChannelQueryResult } from '../../types/channel';
import { formatSatoshis } from '../../utils/format_bitcoin';

export class ChannelFormatter {
  formatChannelList(data: ChannelQueryResult): string {
    const { channels, summary } = data;

    if (channels.length === 0) {
      return "Your node doesn't have any channels at the moment.";
    }

    const formattedCapacity = formatSatoshis(summary.totalCapacity);

    let response = `Your node has ${channels.length} channels with a total capacity of ${formattedCapacity}. `;
    response += `${summary.activeChannels} channels are active and ${summary.inactiveChannels} are inactive.\n\n`;

    // Add details about the top 5 channels by capacity
    const topChannels = [...channels].sort((a, b) => b.capacity - a.capacity).slice(0, 5);

    if (topChannels.length > 0) {
      response += 'Your largest channels:\n';

      topChannels.forEach((channel, index) => {
        const alias = channel.remote_alias || channel.remote_pubkey.substring(0, 10) + '...';
        response +=
          `${index + 1}. ${alias}: ${formatSatoshis(channel.capacity)} ` +
          `(${channel.active ? 'active' : 'inactive'})\n`;
      });
    }

    return response;
  }

  formatChannelHealth(data: ChannelQueryResult): string {
    const { channels, summary } = data;

    if (channels.length === 0) {
      return "Your node doesn't have any channels to check health for.";
    }

    let response = `Channel Health Summary: ${summary.healthyChannels} healthy, ${summary.unhealthyChannels} need attention.\n\n`;

    // Inactive channels
    const inactiveChannels = channels.filter((c) => !c.active);
    if (inactiveChannels.length > 0) {
      response += `You have ${inactiveChannels.length} inactive channels that need attention:\n`;

      inactiveChannels.forEach((channel, index) => {
        const alias = channel.remote_alias || channel.remote_pubkey.substring(0, 10) + '...';
        response += `${index + 1}. ${alias}: ${formatSatoshis(channel.capacity)}\n`;
      });

      response += '\n';
    }

    // Imbalanced channels
    const imbalancedChannels = channels.filter((channel) => {
      if (!channel.active) return false;

      const localRatio = channel.local_balance / channel.capacity;
      return localRatio < 0.1 || localRatio > 0.9; // Extreme imbalance
    });

    if (imbalancedChannels.length > 0) {
      response += `You have ${imbalancedChannels.length} severely imbalanced channels:\n`;

      imbalancedChannels.forEach((channel, index) => {
        const alias = channel.remote_alias || channel.remote_pubkey.substring(0, 10) + '...';
        const localRatio = Math.round((channel.local_balance / channel.capacity) * 100);
        response += `${index + 1}. ${alias}: ${localRatio}% local balance\n`;
      });
    }

    return response;
  }

  formatChannelLiquidity(data: ChannelQueryResult): string {
    const { channels, summary } = data;

    if (channels.length === 0) {
      return "Your node doesn't have any channels to analyze liquidity.";
    }

    const localPercent = Math.round((summary.totalLocalBalance / summary.totalCapacity) * 100);
    const remotePercent = Math.round((summary.totalRemoteBalance / summary.totalCapacity) * 100);

    let response =
      `Liquidity Distribution: ${formatSatoshis(
        summary.totalLocalBalance
      )} local (${localPercent}%), ` +
      `${formatSatoshis(summary.totalRemoteBalance)} remote (${remotePercent}%).\n\n`;

    // Most balanced channels
    const balancedChannels = [...channels]
      .filter((c) => c.active)
      .sort((a, b) => {
        const aRatio = Math.abs(0.5 - a.local_balance / a.capacity);
        const bRatio = Math.abs(0.5 - b.local_balance / b.capacity);
        return aRatio - bRatio;
      })
      .slice(0, 3);

    if (balancedChannels.length > 0) {
      response += 'Your most balanced channels:\n';

      balancedChannels.forEach((channel, index) => {
        const alias = channel.remote_alias || channel.remote_pubkey.substring(0, 10) + '...';
        const localPercent = Math.round((channel.local_balance / channel.capacity) * 100);
        response += `${index + 1}. ${alias}: ${localPercent}% local / ${
          100 - localPercent
        }% remote\n`;
      });

      response += '\n';
    }

    // Most imbalanced channels
    const imbalancedChannels = [...channels]
      .filter((c) => c.active)
      .sort((a, b) => {
        const aRatio = Math.abs(0.5 - a.local_balance / a.capacity);
        const bRatio = Math.abs(0.5 - b.local_balance / b.capacity);
        return bRatio - aRatio;
      })
      .slice(0, 3);

    if (imbalancedChannels.length > 0) {
      response += 'Your most imbalanced channels:\n';

      imbalancedChannels.forEach((channel, index) => {
        const alias = channel.remote_alias || channel.remote_pubkey.substring(0, 10) + '...';
        const localPercent = Math.round((channel.local_balance / channel.capacity) * 100);
        response += `${index + 1}. ${alias}: ${localPercent}% local / ${
          100 - localPercent
        }% remote\n`;
      });
    }

    return response;
  }

  formatUnhealthyChannels(data: ChannelQueryResult): string {
    const { channels, summary } = data;

    if (channels.length === 0) {
      return "Your node doesn't have any channels to check health for.";
    }

    let response = `Your node has ${summary.unhealthyChannels} unhealthy channels out of ${channels.length} total channels.\n\n`;

    // Get unhealthy channels
    const unhealthyChannels = channels.filter((channel) => {
      if (!channel.active) return true; // Inactive channels are unhealthy
      const localRatio = channel.local_balance / channel.capacity;
      return localRatio < 0.1 || localRatio > 0.9; // Extreme imbalance
    });

    if (unhealthyChannels.length === 0) {
      return 'Good news! All your channels are healthy.';
    }

    // List inactive channels first
    const inactiveChannels = unhealthyChannels.filter((c) => !c.active);
    if (inactiveChannels.length > 0) {
      response += `Inactive Channels (${inactiveChannels.length}):\n`;
      inactiveChannels.forEach((channel, index) => {
        const alias = channel.remote_alias || channel.remote_pubkey.substring(0, 10) + '...';
        response += `${index + 1}. ${alias}: ${formatSatoshis(channel.capacity)} (inactive)\n`;
      });
      response += '\n';
    }

    // Then list imbalanced channels
    const imbalancedChannels = unhealthyChannels.filter((c) => c.active);
    if (imbalancedChannels.length > 0) {
      response += `Imbalanced Channels (${imbalancedChannels.length}):\n`;
      imbalancedChannels.forEach((channel, index) => {
        const alias = channel.remote_alias || channel.remote_pubkey.substring(0, 10) + '...';
        const localRatio = (channel.local_balance / channel.capacity) * 100;
        const localPercent = Math.round(localRatio);
        let imbalanceType = '';
        if (localRatio < 10) {
          imbalanceType = 'depleted local balance';
        } else if (localRatio > 90) {
          imbalanceType = 'depleted remote balance';
        }
        response += `${index + 1}. ${alias}: ${localPercent}% local / ${
          100 - localPercent
        }% remote (${imbalanceType})\n`;
      });
    }

    // Add recommendations
    response += '\nRecommendations:\n';
    if (inactiveChannels.length > 0) {
      response +=
        '- For inactive channels: Try reconnecting to the peers or check if they are online\n';
    }
    if (imbalancedChannels.some((c) => c.local_balance / c.capacity < 0.1)) {
      response +=
        '- For channels with low local balance: Consider receiving more inbound liquidity\n';
    }
    if (imbalancedChannels.some((c) => c.local_balance / c.capacity > 0.9)) {
      response +=
        '- For channels with high local balance: Try routing payments through these channels\n';
    }

    return response;
  }
}
