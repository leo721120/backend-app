declare global {
    namespace Express {
        interface Application {
            //config<R>(name: string): Config<R>
            config<R>(name: string, factory: Express.Factory<Config<R>>): this
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
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        config<R>(name: string, factory: Express.Factory<Config<R>>) {
            return this.object(['config', name], factory);
        },
    });
});