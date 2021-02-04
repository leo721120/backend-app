declare global {
    namespace Express {
        interface Application {
            controller(name: 'http'): Controller
            controller(name: 'http', factory: Express.Factory<Controller>): this
        }
    }
}
import { OpenAPIV3 } from 'openapi-types'
import { RequestHandler } from 'express'
import { JSONSchemaType } from 'ajv'
interface Operation {
    op<R extends {
        responses: {
            [code: string]: {
                content: {
                    'application/json'?: unknown
                }
            }
        }
    }>(path: string, options: {
        schema(): OpenAPIV3.OperationObject<{
            summary: string
            description: string
            operationId: string
            responses: OpenAPIV3.ResponsesObject & {
                [Code in keyof R['responses']]: OpenAPIV3.ResponseObject & {
                    description: string
                    content: {
                        [Media in keyof R['responses'][Code]['content']]: OpenAPIV3.MediaTypeObject & Media extends 'application/json' ? {
                            schema: JSONSchemaType<R['responses'][Code]['content'][Media]>
                        } : {
                        }
                    }
                }
            }
        }>
    }, cb: RequestHandler): Controller
}
interface Controller {
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
            openapi: '3.0.x',

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
                    return cb(req, res, next);
                });
                return controller;
            };
        };
        const controller: Controller = {
            get: op('get'),
        };
        app.controller('http', function () {
            return controller;
        });
        return controller;
    });
});