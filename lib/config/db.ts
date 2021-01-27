declare global {
    namespace Express {
        interface Application {
            config(name: 'db'): DocumentConfig
            config(name: 'db', factory: Express.Factory<DocumentConfig>): this
        }
    }
}
declare module '@leo/lib/database/sequelize' {
    interface DocumentModel extends SequelizeModel<Document> {
    }
    interface SequelizeDatabase {
        model(name: 'Config'): Promise<StaticModel<DocumentModel>>
    }
}
interface Document {
    type: string
    name: string
    data: unknown
}
import { Config } from '@leo/lib/config'
interface DocumentConfig {
    document<R>(type: string, name: string): Config<R>
}
class DBConfig<V extends {}> implements Config<V> {
    find<K extends keyof V>(name?: K, value?: V[K]): Promise<V | V[K] | undefined> {
        return this.synchronize(async () => {
            if (name === undefined) {
                return this.findAll();
            } else {
                return this.findOne(name, value);
            }
        });
    }
    async findOne<K extends keyof V>(name: K, value?: V[K]): Promise<V[K] | undefined> {
        const data = await this.findAll();
        return data?.[name] ?? value;
    }
    async findAll(value?: V): Promise<V | undefined> {
        const { log, type, name } = this;
        const model = await this.model;
        log.info('find', { type, name });
        const item = await model.findOne({
            where: { type, name },
            attributes: ['data'],
        });
        if (!item?.data) {
            return value;
        }
        return item.data as V;
    }
    edit<K extends keyof V>(name: K | V, value?: V[K]): Promise<void> {
        return this.synchronize(() => {
            if (value === undefined) {
                return this.editAll(name as V);
            } else {
                return this.editOne(name as K, value);
            }
        });
    }
    async editOne<K extends keyof V>(name: K, value: V[K]): Promise<void> {
        const prev = await this.findAll();
        const data = <V>{
            ...prev,
            [name]: value,
        };
        await this.editAll(data);
    }
    async editAll(data: V): Promise<void> {
        const { log, type, name } = this;
        const model = await this.model;
        log.info('edit', { type, name });
        const item = await model.findOne({
            where: { type, name },
        });
        if (!item) {
            return model.create({
                type, name, data,
            }, { returning: false });
        } else {
            await item.set({ data }).save();
        }
    }
    drop<K extends keyof V>(name?: K): Promise<void> {
        return this.synchronize(() => {
            if (name === undefined) {
                return this.dropAll();
            } else {
                return this.dropOne(name);
            }
        });
    }
    async dropOne<K extends keyof V>(name: K): Promise<void> {
        const data = await this.findAll();
        if (!data) return;
        delete data[name];
        await this.editAll(data);
    }
    async dropAll(): Promise<void> {
        const { log, type, name } = this;
        const model = await this.model;
        log.info('drop', { type, name });
        await model.destroy({
            where: { type, name },
        });
    }
    synchronize<R>(fn: () => R | PromiseLike<R>): Promise<R> {
        return Promise.resolve(fn());
    }
    constructor(
        ctx: Express.Application,
        private type: string,
        private name: string,
        private log = ctx.log('cnf'),
        private db = ctx.database('sequelize'),
    ) {
    }
    private get model() {
        return this.db.model('Config');
    }
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    console.assert(app.config);
    app.config('db', function (ctx) {
        console.assert(ctx.database);
        const database = ctx.database('sequelize');
        console.assert(database.model);
        database.model('Config', async function (ctx) {
            @database.Table({
                modelName: 'Config',
                hooks: {
                },
            })
            class DocumentModel extends database.Model implements Document {
                @database.Column({
                    type: ctx.sequelize.DataTypes.STRING,
                    unique: 'a',
                })
                readonly type: string

                @database.Column({
                    type: ctx.sequelize.DataTypes.STRING,
                    unique: 'a',
                })
                readonly name: string

                @database.Column({
                    type: ctx.sequelize.DataTypes.JSON,
                })
                data: unknown
            };
            return DocumentModel;
        });
        ctx.config('db', function (ctx) {
            return <DocumentConfig>{
                document(type: string, name: string) {
                    return new DBConfig(ctx, type, name);
                },
            };
        });
        return ctx.config('db');
    });
});