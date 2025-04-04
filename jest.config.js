/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Disable type checking for tests
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFiles: ['<rootDir>/src/test/setup.ts'],
  // Tell Jest to mock all imports from ln-service
  moduleNameMapper: {
    '^ln-service$': '<rootDir>/src/test/mocks/ln-service.mock.ts',
  },
};
