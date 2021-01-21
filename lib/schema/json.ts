import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv'
type Schema<V> = JSONSchemaType<V>
type SchemaValidate<V> = {
    (data: V | null | undefined): {
        throw(): never | void
        error?: SchemaError
    }
}
declare global {
    interface SchemaError extends Error {
        errors: ValidateFunction['errors']
    }
    interface JSON {
        Ajv: typeof Ajv
        ajv: Ajv
        schema<R>(define: Schema<R>): Schema<R> & SchemaValidate<R>
    }
}
import { Module } from '@leo/app/instance'
export default Module(async function () {
    const ajv = await import('ajv');
    JSON.ajv = new ajv.default();
    JSON.Ajv = ajv.default;
    JSON.schema = function (define) {
        const validate: SchemaValidate<{}> & {
            compile(): ValidateFunction<{}>
        } = function (data) {
            const res = validate.compile();
            const err = function () {
                return Object.assign(Error(res.errors?.[0].message), <SchemaError>{
                    errors: res.errors,
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
        validate.compile = function () {
            console.assert(JSON.ajv);
            const value = JSON.ajv.compile(define);
            console.assert(value);
            validate.compile = () => value;
            return value;
        };
        return Object.assign(validate, define);
    };
});