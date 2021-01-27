describe('config', function () {
    beforeAll(function() {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function() {
        jest.clearAllMocks();
    });
    describe('doc', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const config = app.config('doc');
            const document = config.document<{
                foo?: string
            }>('abc', 'def');

            await document.find();

            await document.find('foo');

            await document.find('foo', 'default');

            await document.edit('foo', 'xx');

            await document.edit({ foo: 'a' });

            await document.drop('foo');

            await document.drop();
        });
    });
    describe('sql', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const database = app.database('sequelize');
            await database.connect({
                dialect: 'sqlite',
                storage: ':memory:',
                database: 'example',
            });
            app.database('sequelize', function () {
                return database;
            });

            const config = app.config('db');
            const document = config.document<{
                foo?: string
            }>('abc', 'def');

            await document.find();

            await document.find('foo');

            await document.find('foo', 'default');

            await document.edit('foo', 'xx');

            await document.edit({ foo: 'a' });

            await document.drop('foo');

            await document.drop();
        });
    });
});