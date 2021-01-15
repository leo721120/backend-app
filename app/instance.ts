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
interface Module<V> {
    (app: import('express').Application): V | PromiseLike<V>
}
interface Log {
    error(e: Error): void
    info(e: string, a?: unknown): void
    info(e: unknown): void
}
declare global {
    namespace Express {
        interface Factory<V> {
            (ctx: Express.Application): V
        }
        interface Application {
            readonly express: typeof import('express')
            emit(event: 'close'): boolean
            emit(event: 'ready'): boolean
            once(event: 'close', cb: () => void): this
            once(event: 'ready', cb: () => void): this
            on(event: 'close', cb: () => void): this
            on(event: 'ready', cb: () => void): this
            object<R>(names: string[]): Optional<R>
            object<R>(names: string[], factory: Factory<R>): this
            cid(): string
            log(name: string): Log
            load<R>(module: Module<R>): Promise<R>
            load<R>(module: { default?: Module<R> }): Promise<R>
            synchronize<R>(name: string, fn: () => R | PromiseLike<R>): Promise<R>
        }
    }
}
export function Module<R>(fn: Module<R>) {
    return fn;
}
export async function instance() {
    const express = await import('express');
    const now = new Date();
    const app = express();
    const set = function <R>(names: string[], factory: Express.Factory<R>) {
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
        //sequelize,
        express,
        //axios,
        async synchronize(name, fn) {
            const key = `job:${name}`;
            const job = map[key] as Promise<unknown> ?? Promise.resolve();
            map[key] = job.catch((e) => { process.emit('warning', e); }).then(fn);
            return map[key];
        },
        async load<R>(module: Module<R> & { default?: Module<R> }) {
            if (typeof module.default === typeof Function) {
                return this.load(module.default!);
            }
            return module(app);
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
        object<R>(names: string[], factory?: Express.Factory<R>): Optional<R> | Express.Application {
            return factory ? set(names, factory) : get<R>(names)?.(this);
        },
    };
    return Object.assign(app, ctx);
}
import { RequestHandler } from 'express'
{
    const layer = require('express/lib/router/layer');
    layer.prototype.handle_request = <RequestHandler>function (this: any, req, res, next) {
        const fn = this.handle as RequestHandler;

        if (fn.length > 3) {
            return next();
        }
        Promise.resolve().then(function () {
            return fn(req, res, next);
        }).catch(next);
    };
}