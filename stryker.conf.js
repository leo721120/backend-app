/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  packageManager: "npm",
  reporters: ['clear-text', 'progress', 'html'],
  testRunner: "jest",
  jest: { configFile: 'jest.config.js', enableFindRelatedTests: true },
  logLevel: 'debug',
  coverageAnalysis: "perTest",
  concurrency: 1,
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  disableTypeChecks: '**/*',
  symlinkNodeModules: false,
  //buildCommand: 'npm ci',
  inPlace: true,
  mutate: [
    'lib/**/*.ts',
    '!**/?(*.)+(spec|test).ts?(x)',
  ],
};
