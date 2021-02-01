describe('config', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    describe('user', function () {
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

            const service = app.service('User');
            await service.collection({
                //transaction:
            }).make([{
                id: '1',
                name: 'a',
                password: 'a',
            }, {
                id: '2',
                name: 'b',
                password: 'b',
            }]);
            const list = await service.collection({
                where: {
                    name: ['a', 'b'],
                },
            }).list('name');

            list[1].id;//always exist

            const item = await service.entity({
                where: {
                    id: '2',
                },
            }).find('password');

            item?.id;
            item?.password;

            await service.collection({
                where: {
                    id: '2',
                },
            }).drop();
        });
    });
});