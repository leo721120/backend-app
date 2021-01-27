describe('database', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    describe('sequelize', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const database = app.database('sequelize');

            await database.connect({
                dialect: 'sqlite',
                storage: ':memory:',
                database: 'example',
            });
            database.model('Sample', async function (ctx) {
                @database.Table({
                    modelName: 'Sample',
                    hooks: {
                    },
                })
                class SampleModel extends database.Model {
                    @database.Column({
                        type: ctx.sequelize.DataTypes.STRING,
                        primaryKey: true,
                    })
                    readonly id: string
                };
                return SampleModel;
            });

            const model = await database.model('Sample');

            await model.build({
                id: 'aaabbbccc',
            }).save();

            const res = await model.findOne({
                where: {
                    id: 'aaabbbccc',
                },
            });

            res?.toJSON();
        });
    });
    describe('model', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const database = app.database('sequelize');

            app.model('foo', function () {
                const db = app.database('sequelize');
                db.model('foo', async function () {
                    @db.Table({
                        modelName: 'foo',
                        hooks: {
                        },
                    })
                    class C extends db.Model {
                    };
                    return C;
                });
                app.model('foo', function () {
                    return db.model('foo');
                });
                return app.model('foo');
            });
            await database.connect({
                dialect: 'sqlite',
                storage: ':memory:',
                database: 'example',
            });
            app.database('sequelize', function () {
                return database;
            });

            const model = await app.model('foo');
            await model.findAll();
        });
    });
});
declare global {
    namespace Express {
        interface Application {
            model(name: 'foo'): Promise<StaticModel<SequelizeModel<{}>>>
        }
    }
}
import {
    SequelizeModel,
    StaticModel,
} from '@leo/lib/database/sequelize'