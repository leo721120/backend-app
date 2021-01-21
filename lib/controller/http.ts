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
interface Operation<R> {
    (this: Controller, path: string | '/**', options: {
        schema(): OpenAPIV3.OperationObject<{
            summary: string
            description: string
            operationId: string
            responses: OpenAPIV3.ResponsesObject & {
            }
            parameters: Array<OpenAPIV3.ParameterObject & {
            }>
        }>
    }, cb: RequestHandler): R
}
interface Controller {
    get: Operation<this>
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    app.controller('http', function () {
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
        const op: (method: keyof typeof app) => Operation<Controller> = function (method) {
            return function (path, options, cb) {
                console.assert(!openapi.paths[path]?.get);
                const schema = options.schema();
                console.assert(schema);
                openapi.paths[path] = {
                    ...openapi.paths[path],
                    get: schema,
                };

                const bind = (app[method] as typeof app['get']).bind(app);
                console.assert(bind);
                bind(path, async function (req, res, next) {
                    return cb(req, res, next);
                });
                return this;
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