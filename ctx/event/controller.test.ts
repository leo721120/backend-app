describe('POST /events/subscription', function () {
    beforeAll(function () {
        jest.restoreAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.restoreAllMocks();
    });
    describe('201', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const supertest = await import('supertest');
            const ctx = await instance();
            const app = supertest(ctx);
            const database = ctx.database('sequelize');
            await database.connect({
                dialect: 'sqlite',
                storage: ':memory:',
                database: 'example',
            });
            ctx.database('sequelize', function () {
                return database;
            });
            return app.post('/events/subscription')
                .send({})
                .expect(201);
        });
    });
});
describe('GET /events/subscription/:id', function () {
    beforeAll(function () {
        jest.restoreAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.restoreAllMocks();
    });
    describe('201', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const supertest = await import('supertest');
            const ctx = await instance();
            const app = supertest(ctx);
            const database = ctx.database('sequelize');
            await database.connect({
                dialect: 'sqlite',
                storage: ':memory:',
                database: 'example',
            });
            ctx.database('sequelize', function () {
                return database;
            });
            await app.post('/events/subscription')
                .send({})
                .expect(201)
                ;
            const sse = new Promise<import('superagent').Response>(function (done, fail) {
                app.get('/events/subscription/abc123')
                    .end(function (e, res) {
                        e ? fail(e) : done(res);
                    });
            });
            await app.post('/events/echo')
                .send({
                    events: [{
                        type: 'abc',
                        data: { abc: 123 },
                    }, {
                        type: 'abc',
                        data: { abc: 123 },
                    }],
                })
                .expect(204)
                ;
            await app.post('/events/echo')
                .send({
                    events: [{
                        type: 'abc',
                        data: { abc: 123 },
                    }],
                })
                .expect(204)
                ;
            await app.delete('/events/subscription/abc123')
                .expect(200)
                ;
            const res = await sse;
            const data = res.text.split('\n').filter(Boolean).map(function (text) {
                return JSON.parse(text.replace(/^data: /g, ''));
            });
            expect(data).toHaveLength(2 + 1);
            expect(data).toContainEqual({
                events: [{
                    id: expect.any(String),
                    type: 'abc',
                    time: expect.any(String),
                    data: { abc: 123 },
                }],
            });
        });
    });
});