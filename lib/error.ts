declare global {
    namespace ErrorCode {
        type GatewayTimeout = 'GatewayTimeout'
        type MalformedData = 'MalformedData'
        type NotFound = 'NotFound'
    }
    interface Error {
        retrydelay?: number
        resource?: string
        status?: number
        code?:
        | string
        | number //error TS2430: Interface 'ExecException' incorrectly extends interface 'Error'.
        params?: unknown
        details?: unknown
        retry?<R>(): Promise<R>
        toJSON?(): object
    }
    interface ErrorConstructor {
        General<R extends Error>(options: R): R
    }
}
Error.General = function <R extends Error>(options: R): R {
    return Object.assign(Error(options.message), options);
};
export {
}