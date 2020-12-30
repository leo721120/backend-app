export async function instance() {
    const { instance } = await import('./instance');
    const app = await instance();
    await app.load((await import('./config')).default);
    {
        //domain logic...
        {
            app.express.json

            const config = app.config('fs');

            const document = config.document<{
                foo?: string
            }>('abc', 'def');

            await document.find();

            await document.find('foo');

            await document.find('foo', 'default');

            await document.edit('foo', 'xx');

            await document.edit({ foo: 'a' });

            await document.drop('foo');

            await document.drop();
        }
    }
    return app;
}