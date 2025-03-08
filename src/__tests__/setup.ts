// Set up global test environment
process.env.NODE_ENV = 'test';

// Mock all WebAssembly-related functions to prevent issues with ln-service
global.WebAssembly = {
  Module: jest.fn(),
  Instance: jest.fn(),
  compile: jest.fn(),
  validate: jest.fn(),
  compileStreaming: jest.fn(),
  instantiate: jest.fn(),
  instantiateStreaming: jest.fn(),
} as any;

// Handle Buffer for proper type compatibility in tests
global.Buffer = global.Buffer || require('buffer').Buffer;
