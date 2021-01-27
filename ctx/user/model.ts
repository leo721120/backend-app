import { StaticModel, SequelizeModel } from '@leo/lib/database/sequelize'
import { User } from '@leo/ctx/user/schema'

interface UserModel extends SequelizeModel<User> {
}
declare global {
    namespace Express {
        interface Application {
            model(name: 'User'): Promise<StaticModel<UserModel>>
        }
    }
}
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    console.assert(app.model);
    app.model('User', async function () {
        console.assert(app.database);
        const database = app.database('sequelize');
        console.assert(database.model);
        database.model('User', async function (ctx) {
            @database.Table({
                modelName: 'User',
                hooks: {
                },
            })
            class UserModel extends database.Model implements User {
                @database.Column({
                    type: ctx.sequelize.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                })
                readonly id: number

                @database.Column({
                    type: ctx.sequelize.DataTypes.STRING,
                    allowNull: false,
                    unique: 'n',
                })
                readonly name: string

                @database.Column({
                    type: ctx.sequelize.DataTypes.STRING,
                    allowNull: false,
                })
                password: string
            };
            return UserModel;
        });
        app.model('User', function (ctx) {
            return ctx
                .database('sequelize')
                .model('User');
        });
        return app.model('User');
    });
});