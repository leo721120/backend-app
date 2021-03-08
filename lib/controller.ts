declare global {
    namespace Express {
        interface Application {
            //controller(name: string): Controller
            controller(name: string, factory: Express.Factory<Controller>): this
        }
    }
}
export interface Controller {
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        controller(name: string, factory: Express.Factory<Controller>) {
            return this.object(['controller', name], factory);
        },
    });
});