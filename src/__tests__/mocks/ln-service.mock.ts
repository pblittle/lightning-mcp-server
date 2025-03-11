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

// Additional mocked functions for command execution tests
const getChannels = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    channels: [
      {
        id: 'channel-1',
        capacity: 10000000,
        local_balance: 5000000,
        remote_balance: 5000000,
      },
    ],
  });
});

const getPeers = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    peers: [
      {
        public_key: 'peer-1',
        socket: 'peer-1:9735',
      },
    ],
  });
});

const getNetworkInfo = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    average_channel_size: 5000000,
    channel_count: 100,
    max_channel_size: 16777215,
    min_channel_size: 20000,
    node_count: 10000,
    total_capacity: 500000000,
  });
});

const getClosedChannels = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    channels: [
      {
        id: 'closed-channel-1',
        capacity: 10000000,
        close_height: 700000,
      },
    ],
  });
});

const getPendingChannels = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    pending_channels: [
      {
        id: 'pending-channel-1',
        capacity: 10000000,
        is_opening: true,
      },
    ],
  });
});

const getInvoices = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    invoices: [
      {
        id: 'invoice-1',
        request: 'lnbc1000...',
        tokens: 1000,
      },
    ],
  });
});

const getPayments = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    payments: [
      {
        id: 'payment-1',
        destination: 'dest-1',
        tokens: 1000,
      },
    ],
  });
});

const decodePaymentRequest = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    destination: 'test-destination',
    tokens: 1000,
    description: 'Test payment',
  });
});

const createInvoice = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    id: 'invoice-id',
    request: 'lnbc1000...',
    tokens: 1000,
  });
});

const payViaPaymentRequest = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    id: 'payment-id',
    fee: 1,
    tokens: 1000,
  });
});

// Export the mocked functions
export {
  authenticatedLndGrpc,
  getWalletInfo,
  getChainBalance,
  getChannelBalance,
  getChannels,
  getPeers,
  getNetworkInfo,
  getClosedChannels,
  getPendingChannels,
  getInvoices,
  getPayments,
  decodePaymentRequest,
  createInvoice,
  payViaPaymentRequest,
};

// Default export for module-level import
export default {
  authenticatedLndGrpc,
  getWalletInfo,
  getChainBalance,
  getChannelBalance,
  getChannels,
  getPeers,
  getNetworkInfo,
  getClosedChannels,
  getPendingChannels,
  getInvoices,
  getPayments,
  decodePaymentRequest,
  createInvoice,
  payViaPaymentRequest,
};
