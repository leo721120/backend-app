import '@leo/lib/node'
export async function instance() {
    const { instance } = await import('./instance');
    const app = await instance();
    await app.load(await import('@leo/lib/config'));
    await app.load(await import('@leo/lib/config/doc'));
    await app.load(await import('@leo/lib/database'));
    await app.load(await import('@leo/lib/database/sequelize'));
    await app.load(await import('@leo/lib/connection'));
    await app.load(await import('@leo/lib/connection/http'));
    return app;
}