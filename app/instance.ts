declare global {
    namespace Express {
        interface Application {
            readonly sequelize: typeof import('sequelize')
            readonly express: typeof import('express')
            readonly axios: typeof import('axios')
            object<R>(names: string[], factory: (ctx: Express.Application) => R): this
            object<R>(names: string[]): Optional<R>
            log(name: string): Log
            load<R>(controller: Controller<R>): Promise<R>
            synchronize<R>(name: string, fn: () => R | PromiseLike<R>): Promise<R>
        }
    }
}
type Controller<R> = (app: import('express').Application) => R | PromiseLike<R>
type Optional<V> = V | undefined
type Log = {
    error(e: unknown, a?: unknown): void
    info(e: unknown, a?: unknown): void
}
export function Controller<R>(fn: Controller<R>) {
    return fn;
}
export async function instance() {
    const sequelize = await import('sequelize');
    const express = await import('express');
    const axios = await import('axios');
    const app = express();
    const set = function <R>(names: string[], factory: () => R) {
        console.assert(typeof factory === typeof Function, 'factory should be callable function');
        return app.set(names.join('/'), factory);
    };
    const get = function <R>(names: string[]) {
        const factory = app.get(names.join('/')) as Optional<(ctx: Express.Application) => R>;
        console.assert(factory);
        return factory;
    };
    const map = {} as {
        [name: string]: unknown
    };
    const ctx = <Express.Application>{
        sequelize,
        express,
        axios,
        async synchronize(name, fn) {
            const key = `job:${name}`;
            const job = map[key] as Promise<unknown> ?? Promise.resolve();
            map[key] = job.catch((e) => { process.emit('warning', e); }).then(fn);
            return map[key];
        },
        async load<R>(controller: Controller<R>) {
            return controller(app);
        },
        log(name) {
            return {
                error(...a) {
                    console.error(new Date().toISOString(), name, ...a);
                },
                info(...a) {
                    console.info(new Date().toISOString(), name, ...a);
                },
            };
        },
        object<R>(names: string[], factory?: () => R): Optional<R> | Express.Application {
            return factory ? set(names, factory) : get<R>(names)?.(this);
        },
    };
    return Object.assign(app, ctx);
}