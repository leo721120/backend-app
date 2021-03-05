describe('connection', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    describe('http', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const log = app.log('x');
            const connection = app.connection('http');

            await connection.fetch({
                url: 'https://google.com'
            });
            await connection.fetch({
                service: 'test',
                timeout: 1000,
                url: '127.0.0.2',
            }).catch(function (e) {
                jest.spyOn(console, 'error').mockImplementation();
                log.error(e);
            });
        });
    });
    describe('mqtt', function () {
        const { createServer } = require('net') as typeof import('net');
        const aedes = (require('aedes') as typeof import('aedes'))();
        const broker = createServer(aedes.handle);

        beforeAll(function (done) {
            broker.listen(done);
        });
        afterAll(function closeAllClients(done) {
            aedes.close(done);
        });
        afterAll(function closeSocket(done) {
            broker.close(done);
        });
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const mqtt = app.connection('mqtt');
            const address = broker.address() as { port: number };

            const cb1 = jest.fn(function bindBeforeConnect(payload) {
                expect(payload).toEqual(expect.any(Buffer));
            });
            mqtt.once('444/555', cb1);

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
            const cb2 = jest.fn(function bindAfterConnect(payload) {
                expect(payload).toEqual({
                    123: 456,
                });
            });
            mqtt.once('123/456', cb2);
            {
                const res1 = await mqtt.publish({
                    topic: '444/555',
                    payload: Buffer.from('12345'),
                });
                await res1.waitForReply(200);
                expect(cb1).toBeCalledTimes(1);
            }
            {
                const res2 = await mqtt.publish({
                    topic: '123/456',
                    payload: Buffer.from(JSON.stringify({
                        123: 456,
                    })),
                });
                await res2.waitForReply(200);
                expect(cb2).toBeCalledTimes(1);
            }
            await mqtt.close();
        });
    });
});