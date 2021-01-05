declare global {
    namespace Express {
        interface Application {
            database(name: string, factory: (ctx: Express.Application) => Database): this
            database(name: string): Database
        }
    }
}
export interface Database {
}
import { Controller } from './instance'
export default Controller(async function (app) {
    Object.assign(app, <Express.Application>{
        database(name: string, factory?: (ctx: Express.Application) => Database) {
            return factory ? this.object(['database', name], factory) : this.object(['database', name]);
        },
    });
    await app.load((await import('./database.sequelize')).default);
});