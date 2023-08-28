import { Columns, Tables } from '../constant/TABLES';
import { IUser } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import AuthAdmin from './AuthAdmin';
import { Restrictions } from '../constant/OTHERS';

type UserCreationAttributes = Optional<IUser, 'id'>;

class Admin extends Model<IUser, UserCreationAttributes> { }

Admin.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING
    },
    lastname: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    user: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    tableName: Tables.ADMIN,
    timestamps: false,
    indexes: [
        { fields: [Columns.admin.email], name: 'UQ_Admin_Email', unique: true },
        { fields: [Columns.admin.user], name: 'UQ_Admin_User', unique: true }
    ]
})

Admin.hasOne(AuthAdmin, {
    foreignKey: Columns.authAdmin.admin_id,
    sourceKey: Columns.admin.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AuthAdmin.belongsTo(Admin, {
    foreignKey: Columns.authAdmin.admin_id,
    targetKey: Columns.admin.id
})

export = Admin