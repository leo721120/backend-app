import { User } from '@leo/ctx/user/schema'
import { FindOptions } from 'sequelize'

interface Collection<V extends User> {
    make(list: (Omit<V, 'id'> & Partial<V>)[]): Promise<Pick<V, 'id'>[]>
    list<K extends keyof V>(...fields: K[]): Promise<Pick<V, K | 'id'>[]>
    size(): Promise<number>
    drop(): Promise<number>
}
interface Entity<V extends User> {
    find<K extends keyof V>(...fields: K[]): Promise<Pick<V, K | 'id'> | undefined>
    data<K extends keyof V>(...fields: K[]): Promise<Pick<V, K>>
    edit(data: Omit<Partial<V>, 'id'>): Promise<void>
    drop(): Promise<0 | 1>
}
type Find<V, R extends {}> = R & Pick<FindOptions<V>,
    | 'transaction'
    | 'offset'
    | 'limit'
    | 'where'
>
interface Service {
    collection<R extends User>(options: Find<R, {
    }>): Collection<R>
    entity<R extends User>(options: Find<R, {
        where: Pick<R, 'id'>
    }>): Entity<R>
    entity<R extends User>(options: Find<R, {
        where: Pick<R, 'name'>
    }>): Entity<R>
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
        this.options = {
            logging: this.options.logging,
            ...options as {},
        };
        return this as unknown as UserService<R>;
    }
    entity<R extends User>(options: FindOptions<R>): Entity<R> {
        this.options = {
            logging: this.options.logging,
            only1: true,
            limit: 1,
            ...options as {},
        };
        console.assert(this.options.where);
        return this as unknown as UserService<R>;
    }
    async make(list: (Omit<V, 'id'> & Partial<V>)[]): Promise<Pick<V, 'id'>[]> {
        const { nanoid } = await import('nanoid');
        const model = await this.model.user;
        const items = await model.bulkCreate(list.map((item) => {
            return {
                ...item,
                id: item.id ?? nanoid(4),
            };
        }), {
            ...this.options,
        });
        return items as [];
    }
    async list<K extends keyof V>(...fields: K[]): Promise<Pick<V, K | 'id'>[]> {
        const model = await this.model.user;
        const list = await model.findAll({
            ...this.options,
            attributes: fields.length
                ? fields as []
                : undefined,
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
    async find<K extends keyof V>(...fields: K[]): Promise<Pick<V, K | 'id'> | undefined> {
        console.assert(this.options.only1);
        const list = await this.list(...fields);
        return list[0];
    }
    async data<K extends keyof V>(...fields: K[]): Promise<Pick<V, K>> {
        const item = await this.find(...fields);
        if (!item) throw Error.General<UserNotFound>({
            message: 'user not found',
            name: 'UserNotFound',
            code: 'NotFound',
            status: 404,
            params: { where: this.options.where },
        });
        return item;
    }
    async edit(data: Omit<Partial<V>, 'id'>): Promise<void> {
        console.assert(this.options.only1);
        const model = await this.model.user;
        const item = await model.findOne({
            ...this.options,
        });
        if (!item) throw Error.General<UserNotFound>({
            message: 'user not found',
            name: 'UserNotFound',
            code: 'NotFound',
            status: 404,
            params: { where: this.options.where },
        });
        await item.set(data).save();
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
        const log = ctx.log('User');
        return new UserService(ctx, {
            logging(text, ms) {
                log.info(text, { ms });
            },
        });
    });
});