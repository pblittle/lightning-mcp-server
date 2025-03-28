/**
 * @fileoverview Test environment setup.
 *
 * Configures the test environment with necessary mocks for WebAssembly.
 */

// Import just the jest object for mocking
import { jest } from '@jest/globals';

// Make this a module by adding an export
export {};

// Declare WebAssembly as a global variable to avoid TypeScript errors
declare global {
  interface Window {
    WebAssembly: any;
  }

  // Extend the NodeJS global interface
  // Using proper module augmentation
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      WebAssembly: any;
    }
  }
}

// Mock implementation for jest functions if not globally available
const mockFn = (returnValue?: any) => jest.fn(() => returnValue);

// Provide a mock WebAssembly implementation for tests
(global as any).WebAssembly = {
  // Mock implementation of WebAssembly methods
  compile: mockFn(Promise.resolve({})),
  validate: mockFn(true),
  instantiate: mockFn(Promise.resolve({})),
  Module: function MockModule() {
    return {};
  },
  Instance: function MockInstance() {
    return {};
  },
  Memory: function MockMemory() {
    return {};
  },
  Table: function MockTable() {
    return {};
  },
};
