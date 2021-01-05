import { instance } from './domain'

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
instance().then(async function (app) {
    const log = app.log('app');
    {
        //application logic...
        {
            app.express.json;

            const config = app.config('fs');

            const document = config.document<{
                foo?: string
            }>('abc', 'def');

            await document.find();

            await document.find('foo');

            await document.find('foo', 'default');

            await document.edit('foo', 'xx');

            await document.edit({ foo: 'a' });

            await document.drop('foo');

            await document.drop();
        }
        {
            const connection = app.connection('http');

            await connection.fetch({
                url: 'https://google.com'
            });

            await connection.fetch({
                service: 'test',
                timeout: 1000,
                url: '127.0.0.2',
            }).catch(function (e) {
                log.error(e);
            });
        }
        /*{
            const connection = app.connection('ws');

            await connection.connect({
                url: 'ws://127.0.0.1:1883'
            });
        }*/
        {
            const database = app.database('sql');

            await database.connect({
                dialect: 'sqlite',
                storage: ':memory:',
                database: 'example',
            });

            database.model('Sample', function (sequelize) {
                @database.Table({
                    modelName: 'Sample',
                    hooks: {
                    },
                })
                class SampleModel extends database.Model {
                    @database.Column({
                        type: sequelize.Sequelize.DataTypes.STRING,
                        primaryKey: true,
                    })
                    readonly id: string
                };
                return SampleModel.define(sequelize);
            });

            const model = await database.model('Sample');

            await model.build({
                id: 'aaabbbccc',
            }).save();

            const res = await model.findOne({
                where: {
                    id: 'aaabbbccc',
                },
            });

            res?.toJSON();
        }
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