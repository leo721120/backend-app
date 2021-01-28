declare global {
    namespace Express {
        interface Application {
            //connection(name: string): Connection
            connection(name: string, factory: Express.Factory<Connection>): this
        }
    }
}
export interface Connection {
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        connection(name: string, factory?: Express.Factory<Connection>) {
            const prefix = 'connection';
            return factory
                ? this.object([prefix, name], factory)
                : this.object([prefix, name]);
        },
    });
});