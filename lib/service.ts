declare global {
    namespace Express {
        interface Application {
            //service(name: string): Service
            service(name: string, factory: Factory<Service>): this
        }
    }
}
export interface Service {
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        service(name: string, factory?: Express.Factory<Service>) {
            const prefix = 'service';
            return factory
                ? this.object([prefix, name], factory)
                : this.object([prefix, name]);
        },
    });
});