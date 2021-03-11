describe('WS /test', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    global.testcase('message', function ({ given, when, then }) {
        given;
        when;
        then('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            app.ws('/test', function (ws) {
                //ws.once('message', done);
                //ws.once('error', fail);
                ws;
            });
        });
    });
});