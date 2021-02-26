import '@leo/lib/node/promise'
import '@leo/lib/node/error'
export async function instance() {
    const path = await import('path');
    Object.assign(process.env, <NodeJS.ProcessEnv>{
        WORKDIR: path.resolve(__dirname, '..'),
    });

    const { instance } = await import('./instance');
    const assert = await import('assert');
    const app = await instance();
    console.assert = assert;
    app.use(app.initialize());
    await app.load(await import('@leo/lib/event'));
    await app.load(await import('@leo/lib/config'));
    await app.load(await import('@leo/lib/config/db'));
    await app.load(await import('@leo/lib/config/doc'));
    await app.load(await import('@leo/lib/schema'));
    await app.load(await import('@leo/lib/schema/json'));
    await app.load(await import('@leo/lib/service'));
    await app.load(await import('@leo/lib/database'));
    await app.load(await import('@leo/lib/database/model'));
    await app.load(await import('@leo/lib/database/sequelize'));
    //await app.load(await import('@leo/lib/discover/bonjour'));
    await app.load(await import('@leo/lib/connection'));
    await app.load(await import('@leo/lib/connection/http'));
    await app.load(await import('@leo/lib/controller'));
    await app.load(await import('@leo/lib/controller/openapi'));
    await app.load(await import('@leo/lib/controller/websocket'));
    ///
    await app.load(await import('@leo/ctx/user/model'));
    await app.load(await import('@leo/ctx/user/schema'));
    await app.load(await import('@leo/ctx/user/service'));
    await app.load(await import('@leo/ctx/user/controller'));
    await app.load(await import('@leo/ctx/event/controller'));
    app.use(app.finalize());
    return app;
}
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /**
            virtual working directory
            */
            readonly WORKDIR: string
        }
    }
}
declare module '@leo/lib/event' {
    interface Events {
        HttpListen: import('http').Server
        HttpClose: {
        }
    }
}