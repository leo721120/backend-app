import { Database } from './database'
import {
    ModelAttributeColumnOptions,
    SyncOptions,
    DataTypes,
    Sequelize,
    Options,
    Model,
    ModelCtor,
    ModelOptions,
} from 'sequelize'

declare module 'sequelize' {
    namespace Model {
        /**
        Define Model and sync this Model to the DB.
        */
        function define<M extends Model>(this: ModelCtor<M>, sequelize: Sequelize, options?: SyncOptions): Promise<ModelCtor<M>>
    }
    interface Model {
        toJSON<R>(): R;
    }
}
Model.define = async function (this, sequelize, options) {
    if (!sequelize.isDefined(this.options.modelName ?? this.name)) {
        this.init(this.rawAttributes, {
            ...this.options,
            sequelize,
        });
        await this.sync(options).catch((e) => {
            sequelize.modelManager.removeModel(this);
            throw e;
        });
    }
    return this;
};
interface ModelFactory<M extends Model> {
    (sequelize: Sequelize & {
        Sequelize: typeof Sequelize & {
            DataTypes: typeof DataTypes
        }
    }): Promise<ModelCtor<M>>
}
interface SQLDatabase extends Database {
    Column(options: ModelAttributeColumnOptions): (instance: Model, property: string | symbol) => void
    Table(options: ModelOptions): (constructor: typeof Model) => void
    Model: typeof Model
    connect(options: Options): Promise<void>
    model<M extends Model>(name: string, factory: ModelFactory<M>): this
    model<M extends Model>(name: string): Promise<ModelCtor<M>>
}
class SequelizeDatabase implements SQLDatabase {
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
    async connect(options: Options): Promise<void> {
        if (this.sequelize) {
            const sequelize = this.sequelize;
            this.sequelize = undefined;
            await sequelize.close();
        }

        const { Sequelize } = await import('sequelize');
        const log = this.ctx.log('sql');
        this.sequelize = new Sequelize({
            benchmark: true,
            logging: (text, ms) => {
                log.info(text, { ms });
            },
            ...options,
        });
    }
    model<M extends Model>(name: string, factory?: ModelFactory<M>): Promise<ModelCtor<M>> | this | any {
        const get = async () => {
            return this.ctx.synchronize(`sequelize/model/${name}`, async () => {
                if (!this.sequelize!.isDefined(name)) {
                    const factory = this.map.get(name);
                    console.assert(factory);
                    await factory!(this.sequelize! as Parameters<ModelFactory<M>>[0]);
                }
                return this.sequelize!.model(name) as ModelCtor<M>;
            });
        };
        const set = () => {
            console.assert(factory, 'model factory should not be empty');
            this.map.set(name, factory!);
            return this;
        };
        if (!factory) {
            console.assert(this.sequelize, 'should call connect before this');
            return get();
        } else {
            return set();
        }
    }
    constructor(
        private ctx: Express.Application,
    ) {
    }
    Model = Model;
    private sequelize?: Sequelize;
    private map = new Map<string, ModelFactory<Model>>();
}
declare global {
    namespace Express {
        interface Application {
            database(name: 'sql', factory: (ctx: Express.Application) => SQLDatabase): this
            database(name: 'sql'): SQLDatabase
        }
    }
}
import { Controller } from './instance'
export default Controller(async function (app) {
    app.database('sql', function (ctx) {
        return new SequelizeDatabase(ctx);
    });
});