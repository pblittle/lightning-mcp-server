import { Buffer as ImportedBuffer } from 'buffer';

// Set up global test environment
process.env.NODE_ENV = 'test';

// Mock all WebAssembly-related functions to prevent issues with ln-service
// We use a type assertion with unknown to bypass strict type checking for testing
global.WebAssembly = {
  Module: jest.fn(),
  Instance: jest.fn(),
  compile: jest.fn(),
  validate: jest.fn(),
  compileStreaming: jest.fn(),
  instantiate: jest.fn(),
  instantiateStreaming: jest.fn(),
} as unknown as typeof WebAssembly;

// Handle Buffer for proper type compatibility in tests
global.Buffer = global.Buffer || ImportedBuffer;
