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
            app.express.json

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
                //url: 'https://google.com'
            });
        }*/
    }
    const port = process.env.PORT;
    const srv = app.listen(port, function () {
        log.info(srv.address());
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