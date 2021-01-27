declare global {
    namespace Express {
        interface Application {
            //model(name: string): Model
            model(name: string, factory: Express.Factory<Model>): this
        }
    }
}
export interface Model {
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        model(name: string, factory?: Express.Factory<Model>) {
            const prefix = 'model';
            return factory
                ? this.object([prefix, name], factory)
                : this.object([prefix, name]);
        },
    });
});