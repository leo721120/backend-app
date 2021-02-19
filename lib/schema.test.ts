describe('schema', function () {
    beforeAll(function () {
        jest.clearAllMocks();
        jest.spyOn(console, 'info').mockImplementation();
    });
    afterAll(function () {
        jest.clearAllMocks();
    });
    describe('json', function () {
        it('', async function () {
            const { instance } = await import('@leo/app/domain');
            const app = await instance();
            const log = app.log('x');
            const data = {
                foo: 'a',
                bar: 1,
            };
            const schema = JSON.schema<typeof data>({
                type: 'object',
                required: ['bar'],
                properties: {
                    foo: {
                        type: 'string',
                        nullable: true,
                    },
                    bar: {
                        type: 'number',
                        maximum: 9,
                    },
                },
            });
            schema(data).error;
            schema(data).throw();//throw if error exist
            Promise.resolve().then(function () {
                schema({
                    foo: '',
                    bar: 13,
                }).throw();
            }).catch(function (e: SchemaError) {
                jest.spyOn(console, 'error').mockImplementation();
                log.error(e);
                //reference error type
                e.details[0]?.keyword;
            });
        });
        it('openapi', async function () {
            const ajv = new JSON.Ajv({
                strict: false,
                logger: false,
            });
            ajv.addSchema({
                "openapi": "3.0.1",
                "paths": {
                    "/pet": {
                        "put": {
                            "tags": [
                                "pet"
                            ],
                            "summary": "Update an existing pet",
                            "operationId": "updatePet",
                            "requestBody": {
                                "description": "Pet object that needs to be added to the store",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "$ref": "#/components/schemas/Pet"
                                        }
                                    },
                                    "application/xml": {
                                        "schema": {
                                            "$ref": "#/components/schemas/Pet"
                                        }
                                    }
                                },
                                "required": true
                            },
                            "responses": {
                                "400": {
                                    "description": "Invalid ID supplied",
                                    "content": {}
                                },
                                "404": {
                                    "description": "Pet not found",
                                    "content": {}
                                },
                                "405": {
                                    "description": "Validation exception",
                                    "content": {}
                                }
                            },
                            "security": [
                                {
                                    "petstore_auth": [
                                        "write:pets",
                                        "read:pets"
                                    ]
                                }
                            ],
                            "x-codegen-request-body-name": "body"
                        },
                        "post": {
                            "tags": [
                                "pet"
                            ],
                            "summary": "Add a new pet to the store",
                            "operationId": "addPet",
                            "requestBody": {
                                "description": "Pet object that needs to be added to the store",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "$ref": "#/components/schemas/Pet"
                                        }
                                    },
                                    "application/xml": {
                                        "schema": {
                                            "$ref": "#/components/schemas/Pet"
                                        }
                                    }
                                },
                                "required": true
                            },
                            "responses": {
                                "405": {
                                    "description": "Invalid input",
                                    "content": {}
                                }
                            },
                            "security": [
                                {
                                    "petstore_auth": [
                                        "write:pets",
                                        "read:pets"
                                    ]
                                }
                            ],
                            "x-codegen-request-body-name": "body"
                        }
                    },
                    "/pet/{petId}": {
                        "get": {
                            "tags": [
                                "pet"
                            ],
                            "summary": "Find pet by ID",
                            "description": "Returns a single pet",
                            "operationId": "getPetById",
                            "parameters": [
                                {
                                    "name": "petId",
                                    "in": "path",
                                    "description": "ID of pet to return",
                                    "required": true,
                                    "schema": {
                                        "type": "integer",
                                        "format": "int64"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "successful operation",
                                    "content": {
                                        "application/xml": {
                                            "schema": {
                                                "$ref": "#/components/schemas/Pet"
                                            }
                                        },
                                        "application/json": {
                                            "schema": {
                                                "$ref": "#/components/schemas/Pet"
                                            }
                                        }
                                    }
                                },
                                "400": {
                                    "description": "Invalid ID supplied",
                                    "content": {}
                                },
                                "404": {
                                    "description": "Pet not found",
                                    "content": {}
                                }
                            },
                            "security": [
                                {
                                    "api_key": []
                                }
                            ]
                        },
                        "delete": {
                            "tags": [
                                "pet"
                            ],
                            "summary": "Deletes a pet",
                            "operationId": "deletePet",
                            "parameters": [
                                {
                                    "name": "api_key",
                                    "in": "header",
                                    "schema": {
                                        "type": "string"
                                    }
                                },
                                {
                                    "name": "petId",
                                    "in": "path",
                                    "description": "Pet id to delete",
                                    "required": true,
                                    "schema": {
                                        "type": "integer",
                                        "format": "int64"
                                    }
                                }
                            ],
                            "responses": {
                                "400": {
                                    "description": "Invalid ID supplied",
                                    "content": {}
                                },
                                "404": {
                                    "description": "Pet not found",
                                    "content": {}
                                }
                            },
                            "security": [
                                {
                                    "petstore_auth": [
                                        "write:pets",
                                        "read:pets"
                                    ]
                                }
                            ]
                        }
                    }
                },
                "components": {
                    "schemas": {
                        "User": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "integer",
                                    "format": "int64"
                                },
                                "username": {
                                    "type": "string"
                                },
                                "firstName": {
                                    "type": "string"
                                },
                                "lastName": {
                                    "type": "string"
                                },
                                "email": {
                                    "type": "string"
                                },
                                "password": {
                                    "type": "string"
                                },
                                "phone": {
                                    "type": "string"
                                },
                                "userStatus": {
                                    "type": "integer",
                                    "description": "User Status",
                                    "format": "int32"
                                }
                            },
                            "xml": {
                                "name": "User"
                            }
                        },
                        "Pet": {
                            "required": [
                                "name",
                            ],
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "integer",
                                    "format": "int64"
                                },
                                "name": {
                                    "type": "string",
                                    "example": "doggie"
                                }
                            },
                            "xml": {
                                "name": "Pet"
                            }
                        }
                    }
                }
            }, 'openapi');

            expect(ajv.validate({ $ref: 'openapi#/components/schemas/User' }, {
                id: 1,
            })).toBeTruthy();

            expect(ajv.validate({ $ref: 'openapi#/paths/~1pet~1{petId}/get/responses/200/content/application~1json/schema' }, {
                id: 1,
                //photoUrls: [''],
                name: 'abc',
            })).toBeTruthy();
        });
    });
});