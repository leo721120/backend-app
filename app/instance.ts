import { RequestHandler, ErrorRequestHandler } from 'express'
{
    const layer = require('express/lib/router/layer');
    layer.prototype.handle_request = <RequestHandler>function (this: { handle: RequestHandler }, req, res, next) {
        const fn = this.handle;

        if (fn.length > 3) {
            return next();
        }
        Promise.resolve(fn(req, res, next)).catch(next);
    };
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
interface Module<V> {
    (app: import('express').Application): V | PromiseLike<V>
}
interface Log {
    error(e: Error): void
    info(e: string, a?: unknown): void
    info(e: unknown): void
}
declare global {
    type Optional<V> = V | undefined

    namespace Express {
        interface Factory<V> {
            (ctx: Express.Application): V
        }
        interface Request {
            ctx(): Omit<Express.Application, 'emit' | 'once' | 'on'>
            cid(): string
            log(): Log
            //ranges(maxsize: number): Range[]
            //attempt<R>(fn: Message<R>): R
            //querystring<R extends string | number | symbol>(name: string): R[] | undefined
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
            log(...names: string[]): Log
            load<R>(module: Module<R>): Promise<R>
            load<R>(module: { default: Module<R> }): Promise<R>
            finalize(): ErrorRequestHandler[]
            initialize(): RequestHandler[]
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
    const got = function <R>(name: string) {
        return app.get(name) as Optional<R>;
    };
    const err = function (e: Error) {
        process.emit('warning', e);
    };
    const ctx = <Express.Application>{
        express,

        async synchronize(name, fn) {
            const key = `job:${name}`;
            const job = got<Promise<unknown>>(key) ?? Promise.resolve();
            return app.set(key, job.catch(err).then(fn)).get(key);
        },
        async load<R>(module: Module<R> & { default: Module<R> }) {
            if (typeof module.default === typeof Function) {
                return this.load(module.default);
            }
            return module(app);
        },
        cid() {
            return now.getTime().toString(36);
        },
        log(...names) {
            return {
                error(...a) {
                    console.error(new Date().toISOString(), names, ...a);
                },
                info(e: unknown, ...a: unknown[]) {
                    console.info(new Date().toISOString(), names, e, ...a);
                },
            };
        },
        object<R>(names: string[], factory?: Express.Factory<R>): Optional<R> | Express.Application {
            return factory ? set(names, factory) : get<R>(names)?.(this);
        },
        finalize() {
            return [
                function (err: Error, req, res, _) {
                    req.log().error(err);

                    if (!err.status) {
                        err.status = 500;
                    }
                    if (err.retrydelay) {
                        res.set('Retry-After', err.retrydelay.toString());
                    }
                    if (err.code) {
                        res.statusMessage = err.code.toString();
                    }
                    res.status(err.status).json({
                        errors: [
                            err,
                        ],
                    });
                },
            ];
        },
        initialize() {
            return [
                function (req, res, next) {
                    const now = new Date();

                    req.cid = function () {
                        return req.header('x-request-id')
                            || req.header('x-correlation-id') as string;
                    };
                    if (!req.cid()) {
                        const port = req.socket?.remotePort ?? 0;
                        const time = now.getTime() + port + Math.random();
                        const text = time.toString(36);
                        req.cid = () => text;
                    }
                    const log = function (...names: string[]) {
                        return ctx.log(...names, req.cid());
                    };
                    req.log = function () {
                        const obj = log('http');
                        req.log = () => obj;
                        return obj;
                    };
                    req.ctx = function () {
                        const cid = req.cid;
                        const obj = {
                            ...app,
                            log,
                            cid,
                        };
                        req.ctx = function () {
                            return obj;
                        };
                        return obj;
                    };
                    res.once('finish', function () {
                        const elapse = new Date().getTime() - now.getTime();
                        req.log().info({
                            elapse,
                            method: req.method,
                            url: req.path,
                            query: req.query,
                            status: res.statusCode,
                            headers: { ...res.getHeaders() },
                        });
                    });
                    req.log().info({
                        address: req.socket?.remoteAddress,
                        port: req.socket?.remotePort,
                        method: req.method,
                        url: req.path,
                        query: req.query,
                        headers: req.headers,
                    });
                    return next();
                },
            ];
        },
    };
    return Object.assign(app, ctx);
}