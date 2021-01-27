import { User } from '@leo/ctx/user/schema'
import { FindOptions } from 'sequelize'

interface Collection<V extends User> {
    list(): Promise<{ list: V[], total: number }>
    find(): Promise<V[]>
    size(): Promise<number>
    drop(): Promise<number>
}
interface Service {
    collection<R extends User>(options: FindOptions<R>): Collection<R>
}
declare global {
    namespace Express {
        interface Application {
            service(name: 'User'): Service
        }
    }
}
class UserService<V extends User> implements Service, Collection<V> {
    collection<R extends User>(options: FindOptions<R>): Collection<R> {
        this.options = options as {};
        return this as unknown as UserService<R>;
    }
    async list(): Promise<{ list: V[], total: number }> {
        const model = await this.model.user;
        const { rows, count } = await model.findAndCountAll({
            ...this.options,
        });
        return {
            list: rows as [],
            total: count,
        };
    }
    async find(): Promise<V[]> {
        const model = await this.model.user;
        const list = await model.findAll({
            ...this.options,
        });
        return list as [];
    }
    async size(): Promise<number> {
        const model = await this.model.user;
        const size = await model.count({
            ...this.options,
        });
        return size;
    }
    async drop(): Promise<number> {
        const model = await this.model.user;
        const size = await model.destroy({
            ...this.options,
        });
        return size;
    }
    constructor(
        private ctx: Express.Application,
        private options: FindOptions<V>,
    ) {
    }
    private model = {
        ctx: this.ctx,

        get user() {
            return this.ctx.model('User');
        },
    };
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    console.assert(app.service);
    app.service('User', function (ctx) {
        return new UserService(ctx, {});
    });
});