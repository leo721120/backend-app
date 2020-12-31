import './node'
type Controller<R> = (app: import('express').Application) => R | PromiseLike<R>
type Optional<V> = V | undefined
type Log = {
    error(e: Error): void
    info(e: string, a?: unknown): void
    info(e: unknown): void
}
declare module 'express-serve-static-core' {
    /*
    !FIX
    Interface 'Application' cannot simultaneously extend types 'EventEmitter' and 'Application'.
    Named property 'once' of types 'EventEmitter' and 'Application' are not identical.ts(2320)
    */
    interface Application {
        emit(event: string | symbol, ...a: any[]): boolean
        once(event: string | symbol, cb: (...a: any[]) => any): this
    }
}
declare global {
    namespace Express {
        interface Application {
            readonly sequelize: typeof import('sequelize')
            readonly express: typeof import('express')
            readonly axios: typeof import('axios')
            emit(event: 'close'): boolean
            once(event: 'close', cb: () => void): this
            on(event: 'close', cb: () => void): this
            object<R>(names: string[], factory: (ctx: Express.Application) => R): this
            object<R>(names: string[]): Optional<R>
            cid(): string
            log(name: string): Log
            load<R>(controller: Controller<R>): Promise<R>
            synchronize<R>(name: string, fn: () => R | PromiseLike<R>): Promise<R>
        }
    }
}
export function Controller<R>(fn: Controller<R>) {
    return fn;
}
export async function instance() {
    const sequelize = await import('sequelize');
    const express = await import('express');
    const axios = await import('axios');
    const now = new Date();
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
        cid() {
            return now.getTime().toString(36);
        },
        log(name) {
            return {
                error(...a) {
                    console.error(new Date().toISOString(), name, ...a);
                },
                info(e: unknown, ...a: unknown[]) {
                    console.info(new Date().toISOString(), name, e, ...a);
                },
            };
        },
        object<R>(names: string[], factory?: () => R): Optional<R> | Express.Application {
            return factory ? set(names, factory) : get<R>(names)?.(this);
        },
    };
    return Object.assign(app, ctx);
}