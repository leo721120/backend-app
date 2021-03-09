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
export {
}
Promise.resolve().then(async function () {
    const { instance } = await import('./domain');
    const pino = await import('pino');
    const app = await instance({
        log(...names) {
            const log = pino({
                name: names.join('/'),
                //prettyPrint: true,
            });
            return {
                error(e) {
                    log.error(e);
                },
                info(e: unknown, a?: unknown) {
                    a ? log.info(a as object, e as string) : log.info(e as object);
                },
            };
        },
    });
    return app;
    //initialze
    /*{
        const acme = await import('acme-client');

        console.log('directory', acme.directory);

        
        const client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.staging,
            accountKey: await acme.forge.createPrivateKey()
        });

        console.log('acme-clinet', client);

        
        const [key, csr] = await acme.forge.createCsr({
            commonName: 'example.advantech.com'
        });

        console.log(`CSR:\n${csr.toString()}`);
        console.log(`Private key:\n${key.toString()}`);

        
        const cert = await client.auto({
            csr,
            email: 'test@example.advantech.com',
            termsOfServiceAgreed: true,
            async challengeCreateFn(authz, challenge, keyauth) {
                console.info('challengeCreateFn', authz, challenge, keyauth);
            },
            async challengeRemoveFn(authz, challenge, keyauth) {
                console.info('challengeRemoveFn', authz, challenge, keyauth);
            },
        });

        
        
        console.log(`Certificate:\n${cert.toString()}`);
    }*/

}).then(async function (app) {
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
    {
        /*const mqtt = app.connection('mqtt');
        const fs = await import('fs-extra');
        await mqtt.on('#', function (payload, { topic }) {
            const now = new Date().getTime();
            const file = `./topic/${topic}/${now}`.replace(/\:/g, '-');
            try {
                const json = JSON.parse(payload.toString());
                fs.outputJSON(`${file}.json`, json).catch(function (e) {
                    log.error(e);
                });
            } catch {
                fs.outputFile(`${file}.text`, payload).catch(function (e) {
                    log.error(e);
                });
            }
        }).connect({
            protocol: 'mqtt',
            host: '172.22.24.63',
            port: 1883,
            username: 'admin',
            password: '05155853',
        });
        app.event('HttpClose').once(function () {
            mqtt.close().catch(function (e) {
                log.error(e);
            });
        });*/
    }
    return app;
}).then(async function (app) {
    const port = process.env.PORT;
    const log = app.log('app');
    const srv = app.listen(port, function () {
        log.info(srv.address());
        app.event('HttpListen').emit(srv);
    }).on('error', function (e) {
        log.error(e);
    }).once('close', function () {
        log.info('close');
        app.event('HttpClose').emit({
        });
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