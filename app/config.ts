declare global {
    namespace Express {
        interface Application {
            config<R>(name: string, factory: (ctx: Express.Application) => Config<R>): this
            config<R>(name: string): Config<R>
        }
    }
}
export interface Config<V extends {}> {
    find<K extends keyof V>(name: K, value: V[K]): Promise<V[K]>
    find<K extends keyof V>(name: K): Promise<V[K] | undefined>
    find(): Promise<V | undefined>
    edit<K extends keyof V>(name: K, value: V[K]): Promise<void>
    edit(value: V): Promise<void>
    drop<K extends keyof V>(name: K): Promise<void>
    drop(): Promise<void>
}
import { Controller } from './instance'
export default Controller(async function (app) {
    Object.assign(app, <Express.Application>{
        config<R>(name: string, factory?: (ctx: Express.Application) => Config<R>) {
            return factory ? this.object(['config', name], factory) : this.object(['config', name]);
        },
    });
    await app.load((await import('./config.fs')).default);
});