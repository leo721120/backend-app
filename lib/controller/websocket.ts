import { WebsocketMethod } from 'express-ws'
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    const ews = await import('express-ws');
    console.assert(!app.ws);
    ews(app);
});
declare module 'express-serve-static-core' {
    interface Application {
        ws: WebsocketMethod<Application>
    }
}