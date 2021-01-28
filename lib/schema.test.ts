describe('schema', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    describe('json', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const log = app.log('x');
            const data = {
                foo: 'a',
                bar: 1,
            };
            const schema = JSON.schema<typeof data>({
                type: 'object',
                required: ['bar'],
                properties: {
                    foo: {
                        type: 'string',
                        nullable: true,
                    },
                    bar: {
                        type: 'number',
                        maximum: 9,
                    },
                },
            });
            schema(data).error;
            schema(data).throw();//throw if error exist
            Promise.resolve().then(function () {
                schema({
                    foo: '',
                    bar: 13,
                }).throw();
            }).catch(function (e: SchemaError) {
                jest.spyOn(console, 'error').mockImplementation();
                log.error(e);
                //reference error type
                e.details[0]?.keyword;
            });
        });
    });
});