import { User } from '@leo/ctx/user/schema'
import { FindOptions } from 'sequelize'

interface Collection<V extends User> {
    enum(): Promise<{ list: V[], total: number }>
    list(): Promise<V[]>
    size(): Promise<number>
    drop(): Promise<number>
}
interface Entity<V extends User> {
    find(): Promise<V | undefined>
    data(): Promise<V>
    edit(data: Partial<V>): Promise<void>
    drop(): Promise<0 | 1>
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
interface UserNotFound extends Error {
    name: 'UserNotFound'
    code: ErrorCode.NotFound
    status: 404
    params: Pick<FindOptions<User>, 'where'>
}
class UserService<V extends User> implements Service, Collection<V>, Entity<V> {
    collection<R extends User>(options: FindOptions<R>): Collection<R> {
        this.options = options as {};
        return this as unknown as UserService<R>;
    }
    async enum(): Promise<{ list: V[], total: number }> {
        const model = await this.model.user;
        const { rows, count } = await model.findAndCountAll({
            ...this.options,
        });
        return {
            list: rows as [],
            total: count,
        };
    }
    async list(): Promise<V[]> {
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
    async find(): Promise<V | undefined> {
        const model = await this.model.user;
        const item = await model.findOne({
            ...this.options,
        });
        return item as unknown as V;
    }
    async data(): Promise<V> {
        const item = await this.find();
        if (!item) throw Error.General<UserNotFound>({
            message: 'user not found',
            name: 'UserNotFound',
            code: 'NotFound',
            status: 404,
            params: { where: this.options.where },
        });
        return item;
    }
    async edit(data: Partial<V>): Promise<void> {
        data;
    }
    async drop(): Promise<0> {
        const model = await this.model.user;
        const size = await model.destroy({
            ...this.options,
        });
        return size as 0;
    }
    constructor(
        private ctx: Express.Application,
        private options: FindOptions<V> & {
            only1?: true
        },
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