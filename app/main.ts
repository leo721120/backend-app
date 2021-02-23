declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /**
            port of http server, default is `undefined`
            */
            readonly PORT?: string
            /**
            virtual working directory
            */
            readonly WORKDIR: string
        }
    }
}
export {
}
Promise.resolve().then(async function () {
    const path = await import('path');
    Object.assign(process.env, <NodeJS.ProcessEnv>{
        WORKDIR: path.resolve(__dirname, '..'),
    });
}).then(async function () {
    const { instance } = await import('./domain');
    const app = await instance();
    const log = app.log('app');
    {
        app.get('/openapi/v3', function (req, res) {
            const ctx = req.ctx();
            const controller = ctx.controller('openapi');
            res.status(200).json(controller.doc('v3'));
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