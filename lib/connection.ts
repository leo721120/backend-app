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
            return factory
                ? this.object(['connection', name], factory)
                : this.object(['connection', name]);
        },
    });
});