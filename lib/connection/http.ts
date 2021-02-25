declare global {
    namespace Express {
        interface Application {
            connection(name: 'http'): HttpConnection
            connection(name: 'http', factory: Express.Factory<HttpConnection>): this
        }
    }
}
declare module 'axios' {
    interface AxiosRequestConfig {
        /**
        Correlates HTTP requests between a client and server.
        */
        cid?: string
        /**
        Name to trace error.
        */
        service?: string
        time?: Date
        log?: ReturnType<Express.Application['log']>
    }
}
import { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from 'axios'
import { Connection } from '@leo/lib/connection'
interface HttpConnection extends Connection {
    fetch<R>(config: Omit<AxiosRequestConfig, 'log' | 'time'>): Promise<AxiosResponse<R>>
}
interface FetchError extends Error {
    name: 'FetchError'
    code?: ErrorCode.GatewayTimeout | string
    status: 504 | 502 | number
    params: {
        method?: string
        baseURL?: string
        url?: string
        params: object
        headers: object
        timeout?: number
        maxRedirects?: number
        maxBodyLength?: number
        maxContentLength?: number
        data?: string | object
    }
    details: {
        headers: object
        data?: string | object
    }
}
class AxiosConnection implements HttpConnection {
    fetch<R>(params: AxiosRequestConfig): Promise<AxiosResponse<R>> {
        const config = { ...params };
        config.time = new Date();
        config.cid = this.cid;
        config.log = this.log;
        config.headers = {
            ...config.headers,
            'x-request-id': config.cid,
        };
        return this.axios(config);
    }
    constructor(
        private axios: AxiosInstance,
        ctx: Express.Application,
        private log = ctx.log('fetch'),
        private cid = ctx.cid(),
    ) {
    }
}
import { Module } from '@leo/app/instance'
import { Agent } from 'http'
export default Module(async function (app) {
    const pretty = function (data?: string | object | Buffer | NodeJS.ReadableStream) {
        if (typeof (data as NodeJS.ReadableStream | undefined)?.pipe === typeof Function) {
            return '<stream>';
        } else if (Buffer.isBuffer(data)) {
            return '<buffer>';
        } else {
            return data;
        }
    };
    const axios = await import('axios');
    const https = await import('https');
    const http = await import('http');
    const fetch = axios.default.create({
        //maxContentLength: Infinity,
        //maxBodyLength: Infinity,
        adapter: require('axios/lib/adapters/http'),
        timeout: 60000,
        httpAgent: new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 60000,
            maxSockets: 10,
            maxFreeSockets: 5,
            timeout: 60000,
        }),
        httpsAgent: new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 60000,
            maxSockets: 10,
            maxFreeSockets: 5,
            timeout: 60000,
        }),
    });
    fetch.interceptors.request.use(function (req) {
        const headers = { ...req.headers };
        delete headers.common;
        delete headers.delete;
        delete headers.patch;
        delete headers.post;
        delete headers.put;
        delete headers.get;
        delete headers.head;
        req.log?.info({
            cid: req.cid,
            timeout: req.timeout,
            method: req.method,
            host: req.baseURL,
            url: req.url,
            query: req.params,
            headers,
            body: pretty(req.data),
        });
        return req;
    }, function (e: AxiosError) {
        throw e;
    });
    fetch.interceptors.response.use(function (res) {
        const req = res.config;
        const time = req.time!.getTime();
        const elapse = new Date().getTime() - time;
        req.log?.info({
            cid: req.cid,
            method: req.method,
            host: req.baseURL,
            url: req.url,
            elapse,
            status: res.status,
            headers: res.headers,
            //body: pretty(res.data),//trace only
        });
        return res;
    }, function (e: AxiosError) {
        const err = Error.General<FetchError>({
            message: e.message,
            name: 'FetchError',
            stack: e.stack,
            retrydelay: e.response?.headers?.['retry-after'],
            resource: e.config.service,
            status: e.response?.status ?? 502,
            code: e.response?.statusText ?? e.code,
            params: {
                method: e.config.method,
                baseURL: e.config.baseURL,
                url: e.config.url,
                params: e.config.params,
                headers: e.config.headers,
                timeout: e.config.timeout,
                maxRedirects: e.config.maxRedirects,
                maxBodyLength: e.config.maxBodyLength,
                maxContentLength: e.config.maxContentLength,
                data: pretty(e.config.data),
            },
            details: {
                headers: e.response?.headers,
                data: pretty(e.response?.data),
            },
        });
        if (e.code === 'ECONNABORTED') {
            err.retrydelay = 5000;
            err.status = 504;
            err.code = 'GatewayTimeout';
        }
        throw err;
    });
    app.event('HttpClose').once(function () {
        (fetch.defaults.httpsAgent as Agent | undefined)?.destroy();
        (fetch.defaults.httpAgent as Agent | undefined)?.destroy();
    });
    app.connection('http', function (ctx) {
        return new AxiosConnection(fetch, ctx);
    });
});