import '@leo/lib/node'
export async function instance() {
    const { instance } = await import('./instance');
    const assert = await import('assert');
    const app = await instance();
    console.assert = assert;
    app.use(app.initialize());
    await app.load(await import('@leo/lib/config'));
    await app.load(await import('@leo/lib/config/db'));
    await app.load(await import('@leo/lib/config/doc'));
    await app.load(await import('@leo/lib/schema'));
    await app.load(await import('@leo/lib/schema/json'));
    await app.load(await import('@leo/lib/service'));
    await app.load(await import('@leo/lib/database'));
    await app.load(await import('@leo/lib/database/model'));
    await app.load(await import('@leo/lib/database/sequelize'));
    await app.load(await import('@leo/lib/connection'));
    await app.load(await import('@leo/lib/connection/http'));
    await app.load(await import('@leo/lib/controller'));
    await app.load(await import('@leo/lib/controller/http'));
    ///
    await app.load(await import('@leo/ctx/user/model'));
    await app.load(await import('@leo/ctx/user/schema'));
    await app.load(await import('@leo/ctx/user/service'));
    app.use(app.finalize());
    return app;
}