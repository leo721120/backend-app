import { loadFeature, autoBindSteps } from 'jest-cucumber'

autoBindSteps([
    loadFeature(`ctx/user/controller.test.feature`, {
        errors: true,
    }),
], [function ({ given, when, then }) {
    const partialize = function <R extends any>(value: R): R {
        if (!value) {
            return value as R;
        }
        if (typeof value === typeof '') {
            return value;
        }
        if (typeof value === typeof 0) {
            return value;
        }
        if (typeof value === typeof true) {
            return value;
        }
        if (Array.isArray(value)) {
            return expect.arrayContaining(
                value.map(partialize)
            );
        }
        return expect.objectContaining(
            Object.fromEntries(
                Object
                    .entries(value as {})
                    .map(([a, b]) => [a, partialize(b)])
            )
        );
    };
    beforeAll(function () {
        jest.restoreAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.restoreAllMocks();
    });
    class Fixture {
        res?: import('supertest').Response
        req = {
            token: '',
            url: '',
        };
        async app() {
            const { instance } = await import('@leo/app/domain');
            const supertest = await import('supertest');
            const app = await instance();
            const database = app.database('sequelize');
            await database.connect({
                dialect: 'sqlite',
                storage: ':memory:',
                database: 'example',
            });
            app.database('sequelize', function () {
                return database;
            });
            return supertest(app);
        }
        static cleanup() {
            Fixture.instance = Fixture.renew;
        }
        static instance() {
            return Fixture.renew();
        }
        private static renew() {
            const instance = new Fixture();
            Fixture.instance = () => instance;
            return instance;
        }
        private constructor() {
        }
    }
    given(/^url (.*)$/, async function (url: string) {
        const fixture = Fixture.instance();
        fixture.req.url = url;
    });
    given(/^login$/, async function (list: Array<{ username: string, password: string }>) {
        const fixture = Fixture.instance();
        console.assert(list.length === 1);
        const credentials = list[0];
        console.assert(credentials.username);
        console.assert(credentials.password);
        fixture.req.token = `${credentials.username}@${credentials.password}`;
        fixture.req.token = Buffer.from(fixture.req.token).toString('base64');
    });
    when(/^method (.*)$/, async function (method: string) {
        const fixture = Fixture.instance();
        const app = await fixture.app();
        const got = app[method.toLowerCase() as 'get'];
        console.assert(got);
        console.assert(fixture.req.url);
        fixture.res = await got(fixture.req.url!);
    });
    then(/^expect status should be '(\d+)'$/, async function (status: string) {
        const fixture = Fixture.instance();
        expect(fixture.res?.status).toBe(Number(status));
    });
    then(/^expect headers should contain$/, async function (list: Array<{ [header: string]: string }>) {
        const fixture = Fixture.instance();
        console.assert(list.length === 1);
        const headers = list[0];
        expect(fixture.res?.headers).toEqual(expect.objectContaining(headers));
    });
    then(/^expect headers\['(.*)'\] should be '(.*)'$/, async function (header: string, value: string) {
        const fixture = Fixture.instance();
        console.assert(header);
        console.assert(value);
        expect(fixture.res?.headers).toHaveProperty(header, value);
    });
    then(/^expect body should contain$/, async function (text: string) {
        const fixture = Fixture.instance();
        console.assert(text);
        const json = JSON.parse(text);
        console.assert(json);
        expect(fixture.res?.body).toEqual(partialize(json));
    });
    then(/^expect body.(.*)\[\] should have length '(\d+)'$/, async function (name: string, size: string) {
        const fixture = Fixture.instance();
        console.assert(name);
        expect(fixture.res?.body?.[name]).toHaveLength(Number(size));
    });
}]);