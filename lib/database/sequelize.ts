declare global {
    namespace Express {
        interface Application {
            readonly sequelize: typeof import('sequelize')
            database(name: 'sequelize'): SequelizeDatabase
            database(name: 'sequelize', factory: Factory<SequelizeDatabase>): this
        }
    }
}
import { Database } from '@leo/lib/database'
//export { Model } from 'sequelize'
import {
    //SyncOptions,
    //DataTypes,
    Sequelize,
    Options,
    Model,
    //ModelCtor,
    ModelOptions,
    ModelAttributeColumnOptions,
} from 'sequelize'

interface ModelFactory<M extends Model> {
    (ctx: Express.Application): Promise<StaticModel<M>>
}
export type SequelizeModel<V = any> = Model<V> & V
export type StaticModel<M extends Model> = typeof Model & {
    new(): M
}
export interface SequelizeDatabase extends Database {
    Column(options: ModelAttributeColumnOptions): (instance: Model, property: string | symbol) => void
    Table(options: ModelOptions): (constructor: typeof Model) => void
    Model: typeof Model
    model<M extends Model>(name: string): Promise<StaticModel<M>>
    model<M extends Model>(name: string, factory: ModelFactory<M>): this
    connect(options: Options): Promise<void>
}
class SequelizeORM implements SequelizeDatabase {
    Column(options: ModelAttributeColumnOptions): (instance: Model, property: string | symbol) => void {
        return function (instance, property) {
            const constructor = instance.constructor as typeof Model;
            (constructor.rawAttributes as typeof constructor.rawAttributes) = {
                ...constructor.rawAttributes,
                [property]: options,
            };
        };
    }
    Table(options: ModelOptions) {
        return function (constructor: typeof Model) {
            (constructor.options as typeof constructor.options) = {
                ...constructor.options,
                ...options,
            };
        };
    }
    Model = this.ctx.sequelize.Model;
    model<M extends Model>(name: string): Promise<StaticModel<M>>
    model<M extends Model>(name: string, factory: ModelFactory<M>): this
    model<M extends Model>(name: string, factory?: ModelFactory<M>): Promise<StaticModel<M>> | this {
        const get = async () => {
            return this.ctx.synchronize(`sequelize/model/${name}`, async () => {
                const sequelize = await this.sequelize as Sequelize;
                console.assert(sequelize);
                if (!sequelize?.isDefined(name)) {
                    const factory = this.factory[name];
                    console.assert(factory);
                    const model = await factory(this.ctx);
                    console.assert(model);
                    if (!sequelize?.isDefined(name)) {
                        model.init(model.rawAttributes, {
                            ...model.options,
                            sequelize,
                        });
                        await model.sync().catch((e) => {
                            sequelize?.modelManager.removeModel(model);
                            throw e;
                        });
                    }
                }
                return sequelize?.model(name);
            });
        };
        const set = () => {
            console.assert(factory);
            this.factory = {
                ...this.factory,
                [name]: factory!,
            };
            return this;
        };
        if (!factory) {
            return get() as Promise<StaticModel<M>>;
        } else {
            return set();
        }
    }
    async connect(options: Options): Promise<void> {
        if (this.sequelize) {
            const sequelize = await this.sequelize;
            this.sequelize = undefined;
            await sequelize.close();
        }

        const log = this.ctx.log('sql');
        this.sequelize = Promise.resolve(new this.ctx.sequelize.Sequelize({
            benchmark: true,
            logging(text, ms) {
                log.info(text, { ms });
            },
            ...options,
        }));
    }
    constructor(
        private ctx: Express.Application,
    ) {
    }
    private sequelize?: Promise<Sequelize>;
    private factory: {
        [name: string]: ModelFactory<Model>
    }
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    const sequelize = await import('sequelize');
    Object.assign(app, <Express.Application>{
        sequelize,
    });
    app.database('sequelize', function (ctx) {
        return new SequelizeORM(ctx);
    });
});