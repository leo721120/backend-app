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
      teststep<V extends teststeps>(this: typeof global, steps: V): teststep<V> {
        const global = this;
        console.assert(global.describe);
        const map = new Map<keyof V, any>();
        return {
          testcase(name, cb) {
            global.describe(name, () => {
              cb(this);
            });
            return this;
          },
          value(name) {
            console.assert(map.has(name));
            return map.get(name);
          },
          step(name, ...a: any[]) {
            const step = steps[name];
            console.assert(typeof step === typeof Function);
            global.beforeAll(function () {
              const value = step(...a);
              return map.set(name, value).get(name);
            });
            return this;
          },
        };
      },
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
interface teststeps {
  [name: string]: (...a: any) => any
}
interface teststep<V extends teststeps> {
  testcase(name: string, cb: (teststep: this) => void): this
  value<K extends keyof V>(name: K): ReturnType<V[K]>
  step<K extends keyof V>(name: K, ...a: Parameters<V[K]>): this
}
declare global {
  function teststep<V extends teststeps>(this: typeof global, steps: V): teststep<V>
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