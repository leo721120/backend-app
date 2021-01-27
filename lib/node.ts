declare global {
}
declare global {
    interface Fail<P, R> {
        /**
        milliseconds
        */
        retrydelay?: number
        operation?: string
        resource?: string
        service?: string
        status?: number
        code?: string | number
        id?: string
        params?: P
        reason?: R
        retry?<R>(): Promise<R>
    }
    interface Error<P = any, R = any> extends Fail<P, R> {
    }
    interface ErrorConstructor {
        0: <P, R>(e: Error, fail: Fail<P, R> & {
            status: number
        }) => Error<P, R>
    }
}
Error[0] = function (e, fail) {
    return Object.assign(Error(e.message), fail, {
        stack: e.stack,
        name: e.name,
        toJSON(this: Error): object {
            return {
                message: this.message,
                stack: this.stack,
                name: this.name,
                //extends
                retrydelay: this.retrydelay,
                operation: this.operation,
                resource: this.resource,
                service: this.service,
                status: this.status,
                code: this.code,
                id: this.id,
                params: this.params,
                reason: this.reason,
            };
        },
    });
};
export {
}