import { User } from '@leo/ctx/user/schema'
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    console.assert(app.controller);
    const openapi = app.controller('openapi');
    console.assert(openapi);
    openapi.get<{
        responses: {
            200: {
                content: {
                    'application/json': {
                        users: User[]
                    }
                }
            }
        }
    }>('/users', {
        tags: ['User'],
        summary: 'List Users',
        operationId: 'ListUsers',
        responses: {
            200: {
                description: 'success',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['users'],
                            properties: {
                                users: {
                                    type: 'array',
                                    items: app.schema('User'),
                                },
                            },
                        },
                        example: {
                            users: [{
                                id: '#id',
                                name: 'user-1',
                                password: '123456',
                            }],
                        },
                    },
                },
            },
        },
        async handler({ exchange }) {
            const ex = exchange();
            await ex.response(200).accept('application/json', async function () {
                return {
                    users: [{
                        id: 'abc',
                        name: 'abc',
                        password: 'abc',
                    }],
                };
            });
        }
    }).get<{
        responses: {
            200: {
                content: {
                    'application/json': {
                        user: User
                    }
                }
            }
        }
        //headers: {}
        params: {
            id: string
        }
        //query: {}
        //body: {}
    }>('/users/:id', {
        tags: ['User'],
        summary: 'Get User',
        operationId: 'GetUser',
        responses: {
            200: {
                description: 'success',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['user'],
                            properties: {
                                user: app.schema('User'),
                            },
                        },
                        example: {
                            user: {
                                id: '#id',
                                name: 'user-1',
                                password: '123456',
                            },
                        },
                    },
                },
            },
        },
        params: {
            id: {
                description: 'identity of user',
                example: 'user123id',
                schema: app.schema('User').properties!.id,
            },
        },
        async handler({ exchange }) {
            const ex = exchange();
            await ex.response(200).accept('application/json', async function () {
                return {
                    user: {
                        id: ex.params('id'),
                        name: 'abc',
                        password: 'abc',
                    },
                };
            });
        },
    });
    app.ws('/users/events', function (ws) {
        ws.on('close', function (code, reason) {
            console.log('remote closed', { code, reason });
        }).on('error', function (e) {
            console.error(e);
        }).on('upgrade', function (req) {
            console.log('remote upgrade', { req });
        }).on('ping', function (data) {
            console.log('ping', { data });
        }).on('pong', function (data) {
            console.log('pong', { data });
        }).on('message', function (data) {
            console.log('vvvv', { data });
            ws.send(JSON.stringify({ data: 'cccc' }));
        });
    });
});