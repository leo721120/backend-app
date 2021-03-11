import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    Object.assign(app, <Express.Application>{
        crypto(name: string, factory: Express.Factory<Crypto>) {
            return this.object(['crypto', name], factory);
        },
    });
});
declare global {
    namespace Express {
        interface Application {
            crypto(name: string, factory: Factory<Crypto>): this
        }
    }
}
interface Crypto {
}