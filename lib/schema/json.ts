import Ajv, {
    JSONSchemaType,
    ErrorObject,
} from 'ajv'

type Schema<V> = JSONSchemaType<V>
type SchemaValidate<V> = (data?: V | null | undefined) => {
    throw(): never | void
    error?: SchemaError
}
declare global {
    interface JSON {
        Ajv: typeof Ajv
        ajv: Ajv
        schema<R>(define: Schema<R>): Schema<R> & SchemaValidate<R>
    }
    interface SchemaError extends Error {
        name: 'SchemaError'
        code: ErrorCode.MalformedData
        status: 400
        details: ErrorObject[]
    }
}
import { Module } from '@leo/app/instance'
export default Module(async function () {
    const ajv = await import('ajv');
    JSON.ajv = new ajv.default();
    JSON.Ajv = ajv.default;
    JSON.schema = function (define) {
        const ctx = {
            compile() {
                console.assert(JSON.ajv);
                const value = JSON.ajv.compile(define);
                console.assert(value);
                ctx.compile = () => value;
                return value;
            },
        };
        const validate: SchemaValidate<{}> = function (data) {
            const res = ctx.compile();
            const err = function () {
                return Error.General<SchemaError>({
                    message: 'malformed data',
                    name: 'SchemaError',
                    code: 'MalformedData',
                    status: 400,
                    details: res.errors ?? [],
                });
            };
            if (res(data)) return {
                throw() {
                },
            };
            return {
                error: err(),
                throw() {
                    throw this.error;
                },
            };
        };
        return Object.assign(validate, define);
    };
});