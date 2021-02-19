/**
@type {import('@jest/types').Config}
*/
module.exports = {
  preset: 'ts-jest',
  cacheDirectory: '.jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.temp/',
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 50,
      functions: 50,
      statements: 50,
    },
  },
};