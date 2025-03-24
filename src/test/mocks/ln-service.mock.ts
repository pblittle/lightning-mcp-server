/**
 * Mock implementation of ln-service for testing purposes.
 * Provides empty/stub implementations of Lightning Network methods.
 */

// Mock all ln-service methods with stubs
export const getWalletInfo = jest.fn();
export const getChannels = jest.fn();
export const getNodeInfo = jest.fn();
export const getClosedChannels = jest.fn();
export const getPendingChannels = jest.fn();
export const subscribeToInvoices = jest.fn();
export const createHodlInvoice = jest.fn();
export const createInvoice = jest.fn();
export const settleHodlInvoice = jest.fn();
export const createChainAddress = jest.fn();
export const getInvoice = jest.fn();
export const getInvoices = jest.fn();
export const getForwards = jest.fn();
export const getPayments = jest.fn();
export const getNetworkInfo = jest.fn();
export const getFeeRates = jest.fn();
export const authenticatedLndGrpc = jest.fn().mockReturnValue({
  lnd: {},
});
export const subscribeToForwards = jest.fn();
export const pay = jest.fn();
export const probeForRoute = jest.fn();
export const findRoute = jest.fn();

// Missing methods causing test failures
export const getChainBalance = jest.fn();
export const getChannelBalance = jest.fn();

// Add other ln-service methods as needed
