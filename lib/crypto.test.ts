describe('crypto', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    describe('aes-192-cbc', function () {
        it('', async function () {
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
    describe('keystore', function () {
        Object.assign(process.env, {
            CONFIG_HOME: './.temp-config-crypto',
        });
        afterAll(async function () {
            const fs = await import('fs-extra');
            return fs.remove(process.env.CONFIG_HOME!);
        });
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const crypto = app.crypto('keystore');
            const data = {
                txt: 'test',
                num: 478,
            };
            const enc = await crypto.encrypt({ key: 'name', data });
            const dec = await crypto.decrypt({ key: 'name', data: enc });
            expect(dec).toMatchObject(data);
        });
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const crypto = app.crypto('keystore');
            const data = {
                txt: 'test',
                num: 478,
            };
            await crypto.encrypt({ key: 'name', data });
            const dec = crypto.decrypt({ key: 'name', data: 'bad' });
            return expect(dec).rejects.toThrowError('mismatch');
        });
    });
});