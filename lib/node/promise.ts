declare global {
    interface PromiseConstructor {
        lazy<R>(fn: () => R | PromiseLike<R>): Promise<R>
    }
    interface Promise<T> {
        settle<E extends Error>(): Promise<{
            value?: T
            errors?: E[]
        }>
    }
}
interface Thenable<V> extends Promise<V> {
    lazy?: Promise<V>
}
Promise.lazy = function <R>(fn: () => R | PromiseLike<R>): Promise<R> {
    return <Thenable<R>>{
        finally(done) {
            return this.then().finally(done);
        },
        settle() {
            return this.then().settle();
        },
        catch(fail) {
            return this.then().catch(fail);
        },
        then(done, fail) {
            this.lazy = this.lazy ?? Promise.resolve(fn());
            return this.lazy.then(done, fail);
        },
    };
};
Promise.prototype.settle = function () {
    return this.then(function (value) {
        return { value };
    }, function (e) {
        return { errors: [e] };
    });
};
export {
}