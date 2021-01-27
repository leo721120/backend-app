export interface User {
    readonly id: number
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
                type: 'integer',
            },
            name: {
                type: 'string',
            },
            password: {
                type: 'string',
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