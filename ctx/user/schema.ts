export interface User {
    readonly id: string
    readonly name: string
    password: string
}
function Schema() {
    return JSON.schema<User>({
        $id: 'User',
        type: 'object',
        required: [
            'id',
            'name',
            'password',
        ],
        properties: {
            id: {
                type: 'string',
                minLength: 3,
                maxLength: 8,
            },
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
            },
            password: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
            },
        },
    });
}
declare global {
    namespace Express {
        interface Application {
            schema(name: 'User'): ReturnType<typeof Schema>
        }
    }
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    console.assert(app.schema);
    app.schema('User', function () {
        const schema = Schema();
        app.schema('User', () => schema);
        return schema;
    });
});