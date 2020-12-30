import { instance } from './domain'

instance().then(async function (app) {
    const log = app.log('app');
    {
        //application logic...
    }
    const port = process.env.PORT;
    const srv = app.listen(port, function () {
        log.info(srv.address());
    }).on('error', function (e) {
        log.error(e);
    }).on('close', function () {
        log.info('close');
    });
    const close: NodeJS.SignalsListener = function (signal) {
        log.info({ signal });
        srv.close();
    };
    process
        .on('SIGINT', close)
        .on('SIGHUP', close)
        .on('SIGTERM', close)
        .on('SIGQUIT', close)
        .on('warning', function (e) {
            log.error(e);
        }).on('exit', function (code) {
            log.info('exit', code);
        });
}).catch(console.error);