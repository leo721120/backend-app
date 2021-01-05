import './node'
export async function instance() {
    const { instance } = await import('./instance');
    const app = await instance();
    await app.load((await import('./config')).default);
    await app.load((await import('./database')).default);
    await app.load((await import('./connection')).default);
    return app;
}