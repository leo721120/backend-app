declare global {
    namespace Express {
        interface Application {
            //database(name: string): Database
            database(name: string, factory: Express.Factory<Database>): this
        }
    }
}
export interface Database {
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        database(name: string, factory: Express.Factory<Database>) {
            return this.object(['database', name], factory);
        },
    });
});