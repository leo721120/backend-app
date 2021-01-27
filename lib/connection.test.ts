describe('connection', function () {
    beforeAll(function() {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function() {
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
});