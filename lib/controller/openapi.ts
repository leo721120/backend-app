import { Module } from '@leo/app/instance'
import { OpenAPIV3 } from 'openapi-types'
import { RequestHandler } from 'express'
import { JSONSchemaType } from 'ajv'
export default Module(async function (app) {
    app.controller('openapi', function () {
        const info = require(`${process.env.WORKDIR}/package.json`) as {
            license?: string
            description?: string
            version: string
            name: string
        };
        const openapi = OpenAPIv3.document({
            openapi: '3.0.1',

            info: {
                title: info.name,
                version: info.version,
                description: info.description,
            },
            paths: {
            },
        });
        const controller = OpenAPIv3.controller({
            openapi,
            app,
        });
        app.controller('openapi', function () {
            return controller;
        });
        return controller;
    });
});
declare global {
    namespace Express {
        interface Application {
            controller(name: 'openapi'): Controller
            controller(name: 'openapi', factory: Express.Factory<Controller>): this
        }
    }
}
type OperationObject<V>
    = keyof V extends never ? never : V
    ;
type OperationDefine = {
    params?: {
        [prop: string]: string
    }
    responses: {
        [code: number]: {
            content: {
                [media: string]: unknown
            }
        }
    }
}
type OperationSchema<V extends OperationDefine> = {
    tags: string[]
    summary: string
    operationId: string
    responses: OperationObject<{
        [Code in keyof V['responses']]: Code extends keyof OperationResponses<{}> ? OperationResponses<V['responses']>[Code] : never
    }>
} & (V extends Pick<V, 'params'> ? {
    params: OperationObject<{
        [Prop in keyof V['params']]: {
            description: string
            example: V['params'][Prop]
            schema: JSONSchemaType<V['params'][Prop]> | {
                $ref: string
            }
        }
    }>
} : {
})
interface OperationResponses<V extends OperationDefine['responses']> {
    200: {
        description: string
        content: OperationObject<{
            [Media in keyof V[200]['content']]: Media extends keyof OperationContents<{}> ? OperationContents<V[200]['content']>[Media] : never
        }>
    }
    400: {
        description: string
        content: OperationObject<{
            [Media in keyof V[400]['content']]: Media extends keyof OperationContents<{}> ? OperationContents<V[400]['content']>[Media] : never
        }>
    }
}
interface OperationContents<V extends OperationDefine['responses'][number]['content']> {
    'application/xml': OpenAPIV3.MediaTypeObject
    'application/json': {
        example: V['application/json']
        schema: JSONSchemaType<V['application/json']> | {
            $ref: string
        }
    }
}
interface ExchangeResponse<V extends {
    content?: unknown
}> {
    then<R>(done: () => R, fail?: (e: Error) => R): Promise<R>
    accept<M extends keyof V['content']>(media: M, cb: () => Promise<V['content'][M]>): this
}
interface ExchangeRequest<V extends OperationDefine> {
    response<Code extends keyof V['responses']>(code: Code): ExchangeResponse<V['responses'][Code]>
    params<K extends keyof V['params']>(name: K): V['params'][K]
}
interface Operation {
    <R extends OperationDefine>(path: string, options: {
        exchange?(...a: Parameters<RequestHandler>): ExchangeRequest<R>
        schema(): OperationSchema<R>
    }, cb: (
        req: Parameters<RequestHandler>[0] & { exchange(): ExchangeRequest<R> },
        res: Parameters<RequestHandler>[1],
        next: Parameters<RequestHandler>[2],
    ) => void): Controller
}
interface Controller {
    doc(version: 'v3'): OpenAPIV3.Document
    get: Operation
}
namespace OpenAPIv3 {
    interface Document extends OpenAPIV3.Document {
        apis?: {
            [pattern: string]: {
                [method: string]: OpenAPIV3.OperationObject<{
                    params?: { [prop: string]: OpenAPIV3.ParameterBaseObject }
                }>
            }
        }
        operation(method: keyof OpenAPIV3.PathItemObject): {
            define(path: string, item: Required<Document>['apis'][string][string]): void
        }
        validate<A>(options: {
            ref: string
            value: A
            error: Error
        }): void
        validate<A>(options: {
            method: string
            path: string
            params: string
            value: A
            error: Error
        }): void
        content(): OpenAPIV3.Document
    }
    export function document(define: OpenAPIV3.Document): Document {
        const ajv = {} as {
            instance: typeof JSON.ajv
        };
        const doc = Object.assign(define, <Document>{
            apis: {
            },
            content() {
                const { apis, ...content } = doc;
                this.content = function () {
                    return content;
                };
                return this.content();
            },
            validate(options: {
                ref?: string
                method?: string
                path?: string
                params?: string
                value: unknown
                error: Error
            }) {
                if (!ajv.instance) {
                    ajv.instance = new JSON.Ajv({
                        logger: false,
                        strict: false,
                        schemas: {
                            openapi: doc,
                        },
                    });
                }
                if (options.ref) {
                    console.assert(ajv.instance);
                    const err = ajv.instance.validate(options.ref, options.value);
                    options.error.details = ajv.instance.errors;
                    if (!err) throw options.error;
                } else if (options.params) {
                    console.assert(options.method);
                    console.assert(options.path);
                    console.assert(ajv.instance);
                    return this.validate({
                        ref: `openapi#/apis/${options.path!.replace(/\//g, '~1')}/${options.method}/params/${options.params}/schema`,
                        ...options,
                    });
                }
            },
            operation(method) {
                return {
                    define(path, origin) {
                        const { params, ...item } = origin;
                        console.assert(!doc.apis?.[path]?.[method]);
                        console.assert(doc.apis);
                        doc.apis![path] = {
                            ...doc.apis![path],
                            [method]: origin,
                        };
                        if (params) {
                            Object.keys(params).forEach(function (prop) {
                                path = path.replace(`:${prop}`, `{${prop}}`);
                            });
                        }
                        if (params) {
                            item.parameters = [
                                ...item.parameters ?? [],
                                ...Object.entries(params).map(function ([key, value]) {
                                    return {
                                        required: true,
                                        in: 'path',
                                        name: key,
                                        ...value,
                                    };
                                }),
                            ];
                        }
                        doc.paths[path] = {
                            ...doc.paths[path],
                            [method]: item,
                        };
                    },
                };
            },
        });
        return doc;
    }
    export function controller(options: {
        app: import('express').Application,
        openapi: Document,
    }): Controller {
        const { openapi, app } = options;
        const op = function (method: keyof OpenAPIV3.PathItemObject): Operation {
            return function (path, options, cb) {
                const exchange = options.exchange ?? function (req, res) {
                    return {
                        response(code) {
                            const response = {
                                accepts: {
                                    default() {
                                        throw Error.General<Error>({
                                            message: 'MIME type not acceptable',
                                            name: 'HttpError',
                                            code: 'NotAcceptable',
                                            status: 406,
                                        });
                                    },
                                } as {
                                    [media: string]: () => void
                                },
                                async media() {
                                },
                            };
                            return {
                                then(done, fail) {
                                    return Promise.lazy(async () => {
                                        res.status(code as number).format(response.accepts);
                                        const data = await response.media();
                                        res.send(data);
                                    }).then(done, fail);
                                },
                                accept(media, cb) {
                                    response.accepts[media as string] = function () {
                                        response.media = async function () {
                                            const data = await cb();
                                            res.send(data);
                                        };
                                    };
                                    return this;
                                },
                            };
                        },
                        params(name) {
                            const params = name as string;
                            const value = req.params[params];
                            openapi.validate({
                                method,
                                path,
                                params,
                                value,
                                error: Error.General<SchemaError>({
                                    message: `malformed param[${params}]`,
                                    name: 'SchemaError',
                                    code: 'MalformedData',
                                    status: 400,
                                    details: [],
                                }),
                            });
                            return value as any;
                        },
                    };
                };
                const schema = options.schema();
                openapi.operation(method).define(path, schema);
                app[method as 'get'](path, function (req, res, next) {
                    return cb(Object.assign(req, {
                        exchange() {
                            return exchange(req, res, next);
                        },
                    }), res, next);
                });
                return controller;
            };
        };
        const controller: Controller = {
            doc() {
                return openapi.content();
            },
            get: op('get'),
        };
        return controller;
    }
}