declare global {
    namespace Express {
        interface Application {
            controller(name: 'http'): Controller
            controller(name: 'http', factory: Express.Factory<Controller>): this
        }
    }
}
import { OpenAPIV3 } from 'openapi-types'
import { JSONSchemaType } from 'ajv'
type OperationObject<V>
    = keyof V extends never ? never : V
    ;
interface OperationContent<V extends {
    [media: string]: unknown
}> {
    'application/xml': OpenAPIV3.MediaTypeObject
    'application/json': {
        schema: JSONSchemaType<V['application/json']>
        example: V['application/json']
    }
}
interface OperationResponse<V extends {
    [code: string]: { content: {} }
}> {
    200: {
        description: string
        content: OperationObject<{
            [Media in keyof V[200]['content']]: Media extends keyof OperationContent<{}> ? OperationContent<V[200]['content']>[Media] : never
        }>
    }
    400: {
        description: string
        content: OperationObject<{
            [Media in keyof V[400]['content']]: Media extends keyof OperationContent<{}> ? OperationContent<V[400]['content']>[Media] : never
        }>
    }
}
interface ExchangeResponse<V extends {
    content: {
        [media: string]: unknown
    }
}> {
    //headers(o: {}): this
    content(data: {
        [M in keyof V['content']]: () => PromiseLike<V['content'][M]> | V['content'][M]
    }): this
}
interface ExchangeRequest<V extends {
}> {
    headers(): V
    params(): V
    query(): V
    body(): V
}
interface OperationExchange<V extends {
    responses: {
        [code: string]: {
            content: {
                [media: string]: unknown
            }
        }
    }
}> {
    response<Code extends keyof V['responses']>(status: Code): ExchangeResponse<V['responses'][Code]>
    request(): ExchangeRequest<V>
}
import { RequestHandler } from 'express'
interface Operation {
    op<R extends {
        responses: {
            [code: string]: {
                content: {
                    [media: string]: unknown
                }
            }
        }
    }>(path: string, options: {
        schema(): {
            tags: string[]
            summary: string
            operationId: string
            responses: OperationObject<{
                [Code in keyof R['responses']]: Code extends keyof OperationResponse<{}> ? OperationResponse<R['responses']>[Code] : never
            }>
        }
    }, cb: (
        req: Parameters<RequestHandler>[0] & { exchange(): OperationExchange<R> },
        res: Parameters<RequestHandler>[1],
        next: Parameters<RequestHandler>[2],
    ) => void): Controller
}
interface Controller {
    openapi(version: 'v3'): OpenAPIV3.Document
    get: Operation['op']
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    app.controller('http', function () {
        const monkeypatch = function <F extends Function>(fn: F, cb: (fn: F) => F) {
            const temp = fn;
            return cb(temp);
        };
        const structurize = function <V>(value: V): V {
            return JSON.parse(JSON.stringify(value, function (_, value) {
                if (value instanceof Function) return {
                    ...value,
                };
                return value;
            }));
        };
        const info = require(`${process.cwd()}/package.json`) as {
            license?: string
            description?: string
            version: string
            name: string
        };
        const openapi: OpenAPIV3.Document = {
            openapi: '3.0.1',

            info: {
                title: info.name,
                version: info.version,
                description: info.description,
            },
            paths: {
            },
        };
        const op = function (method: keyof OpenAPIV3.PathItemObject): Operation['op'] {
            return function (path, options, cb) {
                console.assert(!openapi.paths[path]?.[method]);
                const schema = structurize(options.schema());
                console.assert(schema);
                openapi.paths[path] = {
                    ...openapi.paths[path],
                    [method]: schema,
                };

                const bind = app[method as 'get'].bind(app);
                console.assert(bind);
                bind(path, async function (req, res, next) {
                    res.json = monkeypatch(res.json, function (fn) {
                        return function (data) {
                            const response = schema.responses?.[res.statusCode] as OpenAPIV3.ResponseObject | undefined;
                            console.assert(response);
                            const media = response?.content?.['application/json'];
                            console.assert(media);
                            JSON.schema<{}>(media?.schema as {
                                type: 'object'
                                required: []
                            })(data).throw();
                            return fn.call(res, data);
                        };
                    });
                    return cb(Object.assign(req, {
                        exchange() {
                            return null as any;
                        },
                    }), res, next);
                });
                return controller;
            };
        };
        const controller: Controller = {
            openapi() {
                return openapi;
            },
            get: op('get'),
        };
        app.controller('http', function () {
            return controller;
        });
        return controller;
    });
});