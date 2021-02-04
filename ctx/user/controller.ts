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
                summary: 'List Users',
                description: `List all users`,
                operationId: 'ListUsers',
                parameters: [],
                responses: {
                    200: {
                        description: `Response with all users`,
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
                            },
                        },
                    },
                },
            };
        },
    }, function (req, res) {
        req;
        res.status(200).json({
            users: [{
                id: 'abc',
                name: 'abc',
                password: 'abc',
            }],
        });
    });
});