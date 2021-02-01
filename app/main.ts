declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /**
            port of http server, default is `undefined`
            */
            readonly PORT?: string
        }
    }
}
import { instance } from './domain'
instance().then(async function (app) {
    const log = app.log('app');
    {
        //application logic...
        /*{
            const connection = app.connection('ws');

            await connection.connect({
                url: 'ws://127.0.0.1:1883'
            });
        }*/
        {
            app.get('/sample', function (_, res) {
                res.status(200).json({
                });
            }).get('/sample/error', function (_req, _res) {
                return Promise.reject(new Error('sample error'));
            }).use(function (err: Error, _req: any, res: any, _next: any) {
                res.status(500).json({
                    err: {
                        message: err.message,
                    },
                });
            }).once('ready', async function () {
                const connection = app.connection('http');
                const address = srv.address() as { port: number };
                const host = `http://localhost:${address.port}`;
                {
                    const res = await connection.fetch({
                        baseURL: host,
                        url: '/sample',
                    });
                    log.info('example', {
                        status: res.status,
                        data: res.data,
                    });
                }
                {
                    const res = await connection.fetch({
                        validateStatus: () => true,
                        baseURL: host,
                        url: '/sample/error',
                    });
                    log.info('example', {
                        status: res.status,
                        data: res.data,
                    });
                }
            });
        }
        {
            const controller = app.controller('http');

            controller.get('/foo/:id', {
                schema() {
                    return {
                        summary: 'summary',
                        description: 'description',
                        operationId: 'operationId',
                        parameters: [{
                            in: 'path',
                            name: 'id',
                            description: 'params [id]',
                            required: true,
                            schema: {
                                type: 'string',
                            }
                        }, {
                            in: 'query',
                            name: 'q',
                            description: 'query [q]',
                            schema: {
                                type: 'string',
                                minLength: 1,
                            }
                        }],
                        responses: {
                            200: {
                                description: '200',
                            },
                        },
                    };
                },
            }, function (req, res) {
                res.status(200).end();
                req;
            });
            app.once('ready', async function () {
                const connection = app.connection('http');
                const address = srv.address() as { port: number };
                const host = `http://localhost:${address.port}`;
                {
                    const res = await connection.fetch({
                        baseURL: host,
                        url: '/foo/123',
                    });
                    log.info('foo', {
                        status: res.status,
                        data: res.data,
                    });
                }
            });
        }
    }
    const port = process.env.PORT;
    const srv = app.listen(port, function () {
        log.info(srv.address());
        app.emit('ready');
    }).on('error', function (e) {
        log.error(e);
    }).once('close', function () {
        log.info('close');
        app.emit('close');
    });
    const close: NodeJS.SignalsListener = function (signal) {
        log.info({ signal });
        srv.close();
    };
    process
        .once('SIGINT', close)
        .once('SIGHUP', close)
        .once('SIGTERM', close)
        .once('SIGQUIT', close)
        .once('exit', function (code) {
            log.info('exit', code);
        }).on('warning', function (e) {
            log.error(e);
        });
}).catch(console.error);