// Mock implementation of ln-service module for tests
import { jest } from '@jest/globals';

// Create simple mock functions
const authenticatedLndGrpc = jest.fn().mockReturnValue({ id: 'mock-lnd-instance' });

// Use mockImplementation with any type to avoid TypeScript errors
const getWalletInfo = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    alias: 'test-node',
    public_key: 'test-pubkey',
    version: '0.15.1',
    active_channels_count: 5,
    peers_count: 10,
    block_height: 700000,
    is_synced_to_chain: true,
    is_testnet: false,
    chains: ['bitcoin'],
  });
});

const getChainBalance = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    confirmed_balance: 90000000,
    unconfirmed_balance: 10000000,
  });
});

const getChannelBalance = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    channel_balance: 50000000,
    pending_balance: 20000000,
  });
});

// Export the mocked functions
export { authenticatedLndGrpc, getWalletInfo, getChainBalance, getChannelBalance };

// Default export for module-level import
export default {
  authenticatedLndGrpc,
  getWalletInfo,
  getChainBalance,
  getChannelBalance,
};
