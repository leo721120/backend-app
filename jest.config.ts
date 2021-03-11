import type { Config } from '@jest/types'
export default async (): Promise<Config.InitialOptions> => {
  return {
    //verbose: true,
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
    globals: {
      testcase: <typeof testcase>function (name, cb) {
        const internal = this;
        console.assert(internal.describe);
        internal.describe(name, function () {
          const map = {
            given: new Map<string, Promise<unknown>>(),
            when: new Map<string, Promise<unknown>>(),
            then: new Map<string, Promise<unknown>>(),
          };
          cb({
            given(n, cb) {
              internal.beforeAll(function () {
                return map.given.set(n, cb()).get(n);
              });
            },
            when(n, cb) {
              internal.beforeEach(function () {
                return map.when.set(n, cb()).get(n);
              });
            },
            then(n, cb) {
              internal.it(n, function () {
                return map.then.set(n, cb()).get(n);
              });
            },
            ctx: {
              given<R>(name: string) {
                return map.given.get(name) as Promise<R>;
              },
              when<R>(name: string) {
                return map.when.get(name) as Promise<R>;
              },
              then<R>(name: string) {
                return map.then.get(name) as Promise<R>;
              },
            },
          });
        });
      },
    },
  };
};
declare global {
  function testcase(this: typeof global, name: string, cb: (options: {
    given<R>(name: string, cb: () => Promise<R>): void
    when<R>(name: string, cb: () => Promise<R>): void
    then<R>(name: string, cb: () => Promise<R>): void
    ctx: {
      given<R>(name: string): Promise<R>
      when<R>(name: string): Promise<R>
      then<R>(name: string): Promise<R>
    }
  }) => void): void
}