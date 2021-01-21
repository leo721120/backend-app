declare global {
    namespace Express {
        interface Application {
            //schema(name: string): Schema
            schema(name: string, factory: Factory<Schema>): this
        }
    }
}
export interface Schema {
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        schema(name: string, factory?: Express.Factory<Schema>) {
            const prefix = 'schema';
            return factory
                ? this.object([prefix, name], factory)
                : this.object([prefix, name]);
        },
    });
});