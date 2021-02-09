import { User } from '@leo/ctx/user/schema'
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    console.assert(app.controller);
    const controller = app.controller('http');
    controller.get<{
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
        schema() {
            return {
                tags: ['User'],
                summary: 'List Users',
                operationId: 'ListUsers',
                parameters: [],
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
                                            items: {
                                                type: app.schema('User').type,
                                                required: app.schema('User').required,
                                                properties: app.schema('User').properties,
                                            },
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
            };
        },
    }, function (ex, req, res) {
        ex;
        req;
        res.status(200).json({
            users: [{
                id: 'abc',
                name: 'abc',
                password: 'abc',
            }],
        });
    });
    controller.get<{
        responses: {
            200: {
                content: {
                    'application/json': {
                    }
                }
            }
            400: {
                content: {
                    'application/json': {}
                }
            }
        }
    }>('/test', {
        schema() {
            return {
                tags: ['Test'],
                summary: 'Test',
                operationId: 'Test',
                parameters: [],
                responses: {
                    200: {
                        description: 'success',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: [],
                                },
                                example: {
                                },
                            },
                        },
                    },
                    400: {
                        description: 'too bad',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: [],
                                },
                                example: {
                                },
                            },
                        },
                    },
                },
            };
        },
    }, async function (ex, req, res) {
        ex;
        req;
        res.status(200).json({
        });
    });
});