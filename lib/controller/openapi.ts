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
interface Controller {
    doc(version: 'v3'): OpenAPIV3.Document
    get: OpenAPIv3.Operation
}
namespace OpenAPIv3 {
    export function document(define: OpenAPIV3.Document): Document {
        const ajv = {} as {
            instance: typeof JSON.ajv
        };
        return Object.assign(define, <Document>{
            apis: {
            },
            content() {
                const { apis, ...content } = this;
                return content as OpenAPIV3.Document;
            },
            validate(options) {
                ajv.instance ??= new JSON.Ajv({
                    logger: false,
                    strict: false,
                    schemas: {
                        openapi: this,
                    },
                });
                console.assert(ajv.instance);
                const err = ajv.instance.validate(options.ref, options.value);
                options.error.details = ajv.instance.errors;
                if (!err) throw options.error;
                return this;
            },
            operation(method, path) {
                return {
                    validate: (options) => {
                        return this.validate({
                            ref: `openapi#/apis/${path!.replace(/\//g, '~1')}/${method}/params/${options.params}/schema`,
                            ...options,
                        });
                    },
                    define: (op) => {
                        const { params, ...item } = op;
                        console.assert(this.apis);
                        this.apis![path] = {
                            ...this.apis![path],
                            [method]: op,
                        };
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
                        if (params) {
                            Object.keys(params).forEach(function (prop) {
                                path = path.replace(`:${prop}`, `{${prop}}`);
                            });
                        }
                        this.paths[path] = {
                            ...this.paths[path],
                            [method]: item,
                        };
                        return this;
                    },
                };
            },
        });
    }
    export interface Document extends OpenAPIV3.Document {
        apis?: {
            [path: string]: {
                [method: string]: unknown
            }
        }
        content(): OpenAPIV3.Document
        validate<A>(options: {
            ref: string
            value: A
            error: Error
        }): Document
        operation(method: keyof OpenAPIV3.PathItemObject, path: string): {
            validate<A>(options: {
                params: string
                value: A
                error: Error
            }): Document
            define(item: OpenAPIV3.OperationObject<{
                params?: { [prop: string]: OpenAPIV3.ParameterBaseObject }
            }>): Document
        }
    }
}
namespace OpenAPIv3 {
    export function controller(options: {
        app: import('express').Application,
        openapi: OpenAPIv3.Document,
    }): Controller {
        const { openapi, app } = options;
        const op = function (method: keyof OpenAPIV3.PathItemObject): Operation {
            return function (path, schema) {
                openapi.operation(method, path).define(schema);
                if (!schema.handler) return controller;
                const exchange = schema.exchange ?? function (req, res) {
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
                            openapi.operation(method, path).validate({
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
                app[method as 'get'](path, function (req, res, next) {
                    return schema.handler!(Object.assign(req, {
                        exchange() {
                            return exchange(req, res, next);
                        },
                    }), res, next);
                });
                return controller;
            };
        };
        const controller: Controller = {
            doc() { return openapi.content(); },
            get: op('get'),
        };
        return controller;
    }
    export interface Operation {
        <R extends OperationDefine>(path: string, schema: OperationSchema<R>): Controller
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
        exchange?(...a: Parameters<RequestHandler>): ExchangeRequest<V>
        handler?(
            req: Parameters<RequestHandler>[0] & { exchange(): ExchangeRequest<V> },
            res: Parameters<RequestHandler>[1],
            next: Parameters<RequestHandler>[2],
        ): void
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
}