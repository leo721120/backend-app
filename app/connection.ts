declare global {
    namespace Express {
        interface Application {
            connection(name: string, factory: (ctx: Express.Application) => Connection): this
            connection(name: string): Connection
        }
    }
}
export interface Connection {
}
import { Controller } from './instance'
export default Controller(async function (app) {
    Object.assign(app, <Express.Application>{
        connection(name: string, factory?: (ctx: Express.Application) => Connection) {
            return factory ? this.object(['connection', name], factory) : this.object(['connection', name]);
        },
    });
    await app.load((await import('./connection.http')).default);
});