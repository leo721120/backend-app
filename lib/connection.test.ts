describe('connection', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    global.testcase('http', function ({ ctx, given, when, then }) {
        async function mock(app: import('express').Application) {
            const { createRequest, createResponse } = await import('node-mocks-http');
            const settle = require('axios/lib/core/settle') as (...a: any[]) => any;
            const axios = await import('axios');
            return axios.default.create({
                transformRequest(data) {
                    return data;
                },
                adapter(config) {
                    return new Promise<any>(function (done, fail) {
                        const res = createResponse();
                        const req = createRequest({
                            method: config.method?.toUpperCase() as 'GET',
                            url: config.url,
                            headers: config.headers,
                            query: config.params,
                            body: config.data,
                        });
                        const data = function () {
                            const buffer = res._getBuffer();
                            if (buffer?.length) return buffer;
                            const data = res._getData();
                            if (Buffer.isBuffer(data)) return data;
                            return Buffer.from(JSON.stringify(data));
                        };
                        const body = function () {
                            const body = data();

                            if (!config.responseType) {
                                config.responseType = 'json';
                            }
                            if (config.responseType === 'json') {
                                return JSON.parse(body.toString());
                            }
                            if (config.responseType === 'arraybuffer') {
                                return body;
                            }
                            return body;
                        };
                        req.baseUrl = '';
                        req.pipe = function (stream) {
                            stream.end(JSON.stringify(req.body));
                            return stream;
                        };
                        app(req, res);
                        res.once('end', function () {
                            if (req.method !== 'HEAD' && req.method !== 'GET') return;
                            const etag = app.get('etag fn') as Function | undefined;
                            if (!etag) return;
                            res.set('etag', etag(data()));
                            if (req.fresh) res.status(304);
                        });
                        res.once('finish', function () {
                            settle(done, fail, {
                                data: body(),
                                status: res._getStatusCode(),
                                statusText: res._getStatusMessage(),
                                headers: res._getHeaders(),
                                config,
                            });
                        });
                        if (res._isEndCalled()) {
                            res.emit('end');
                            res.emit('finish');
                        }
                    });
                },
            });
        }
        given('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            app.get('/test', function (_, res) {
                res.status(200).send({
                    abc: 123,
                });
            });
            return app;
        });
        when('', async function () {
            const app = await ctx.given<import('express').Application>('');
            const http = app.connection('http');
            const connection = http.instance(await mock(app));
            const res = await connection.fetch<{
                abc: 123
            }>({
                url: '/test',
                schema: {
                    type: 'object',
                    required: ['abc'],
                    properties: {
                        abc: {
                            type: 'number',
                        },
                    },
                },
            });
            return res;
        });
        then('', async function () {
            const res = await ctx.when<import('axios').AxiosResponse>('');
            expect(res.data).toMatchObject({
                abc: 123,
            });
        });
    });
    global.testcase('mqtt', function ({ ctx, given, when, then }) {
        const { createServer } = require('net') as typeof import('net');
        const aedes = (require('aedes') as typeof import('aedes'))();
        const broker = createServer(aedes.handle);
        const cb = {
            cb1: jest.fn(function bindBeforeConnect(payload) {
                expect(payload).toEqual(expect.any(Buffer));
            }),
            cb2: jest.fn(function bindAfterConnect(payload) {
                expect(payload).toEqual({
                    123: 456,
                });
            }),
        };
        beforeAll(function (done) {
            broker.listen(done);
        });
        afterAll(function closeAllClients(done) {
            aedes.close(done);
        });
        afterAll(function closeSocket(done) {
            broker.close(done);
        });
        given('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            return app;
        });
        given('', async function () {
            const app = await ctx.given<Express.Application>('');
            const mqtt = app.connection('mqtt');
            const address = broker.address() as { port: number };
            mqtt.once('444/555', cb.cb1);

            await mqtt.connect({
                reconnectPeriod: 0,
                protocol: 'mqtt',
                port: address.port,
                host: 'localhost',
                //username: 'admin',
                //password: '05155853',
                subscribe: {
                    '123/456': {
                        intercept(buffer) {
                            return JSON.parse(buffer.toString());
                        },
                        qos: 1,
                    },
                },
            });
            return mqtt;
        });
        given('', async function () {
            const mqtt = await ctx.given<import('./connection/mqtt').Connection>('');
            mqtt.once('123/456', cb.cb2);
            return mqtt;
        });
        when('', async function () {
            const mqtt = await ctx.given<import('./connection/mqtt').Connection>('');
            const res = await mqtt.publish({
                topic: '444/555',
                payload: Buffer.from('12345'),
            });
            return res.waitForReply(200);
        });
        when('', async function () {
            const mqtt = await ctx.given<import('./connection/mqtt').Connection>('');
            const res = await mqtt.publish({
                topic: '123/456',
                payload: Buffer.from(JSON.stringify({
                    123: 456,
                })),
            });
            return res.waitForReply(200);
        });
        then('', async function () {
            expect(cb.cb1).toBeCalledTimes(1);
        });
        then('', async function () {
            expect(cb.cb2).toBeCalledTimes(1);
        });
    });
});