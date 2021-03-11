describe('crypto', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    testcase('aes-192-cbc', global, function ({ then }) {
        then('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const crypto = app.crypto('aes-192-cbc');
            const data = Buffer.from('abc123xyz987');
            const enc = await crypto.encrypt({
                data,
                key: '4433key',
            });
            const dec = await crypto.decrypt({
                data: enc,
                key: '4433key',
            });
            expect(dec).toEqual(data);
        });
    });
});