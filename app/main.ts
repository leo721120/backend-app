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
        app.get('/openapi/v3', function (req, res) {
            const ctx = req.ctx();
            const controller = ctx.controller('http');
            res.status(200).json(controller.openapi('v3'));
        });
        //application logic...
        /*{
            const connection = app.connection('ws');

            await connection.connect({
                url: 'ws://127.0.0.1:1883'
            });
        }*/
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