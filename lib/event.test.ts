describe('event', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    describe('emit', function () {
        it('once', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const evt = app.event('/test/foo' as any);
            const cb = jest.fn(function (e) {
                expect(e.id).toEqual(expect.any(String));
                expect(e.type).toBe('/test/foo');
                expect(e.time).toEqual(expect.any(Date));
                expect(e.data).toEqual({
                    abc: 'def',
                    123: 456,
                });
            });
            evt.once(cb).emit({
                abc: 'def',
                123: 456,
            });
            evt.emit({
                none: null,
            });
            expect(cb).toBeCalledTimes(1);
        });
        it('correlation', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const evt = app.event('/test/foo' as any);
            evt.once(function (e) {
                const cb = jest.fn(function (e2) {
                    expect(e2.id).toEqual(e.id);
                    expect(e2.type).toEqual('/test/foo');
                    expect(e2.time).toEqual(e.time);
                    expect(e2.data).toEqual({
                        abc: 456,
                    });
                });
                expect(e.id).toEqual(expect.any(String));
                expect(e.type).toEqual('/test/foo');
                expect(e.time).toEqual(expect.any(Date));
                expect(e.data).toEqual({
                    abc: 123,
                });
                evt.once(cb).emit({
                    abc: 456,
                }, e);
                expect(cb).toBeCalledTimes(1);
            }).emit({
                abc: 123,
            });
        });
    });
});