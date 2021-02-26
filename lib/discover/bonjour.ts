import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    const bonjour = await import('bonjour');
    const log = app.log('discover');
    const discover = bonjour({
        type: 'udp4',
    });
    app.event('HttpListen').once(function (e) {
        const { port } = e.data.address() as import('net').AddressInfo;
        {
            const service = discover.publish({
                name: 'backend-app',
                type: 'http',
                port,
                subtypes: ['backend'],
            });
            service.on('error', function (e) {
                log.error(e);
            });
            service.start();
        }
    });
    app.event('HttpClose').once(function () {
        discover.unpublishAll(function () {
            log.info('service unpublish');
            discover.destroy();
        });
    });
    {
        const service = discover.find({
            //type: 'http',
        });
        service.on('up', function (service) {
            log.info('service found', { service });
        }).on('down', function (service) {
            log.info('service leave', { service });
        });
        service.start();
    }
});