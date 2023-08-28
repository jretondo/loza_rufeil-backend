import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IUserPermission } from '../interfaces/Tables';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import Admin from './Admin';
import Client from './Client';
import ClientsPermissions from './ClientsPermissions';

type UserPermissionCreationAttributes = Optional<IUserPermission, 'id'>;

class AdminPermission extends Model<IUserPermission, UserPermissionCreationAttributes> { }

AdminPermission.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    permission_id: {
        type: DataTypes.INTEGER
    },
    permission_grade: {
        type: DataTypes.INTEGER
    },
    client_id: {
        type: DataTypes.INTEGER
    },
    client_enabled: {
        type: DataTypes.BOOLEAN
    }
}, {
    sequelize,
    tableName: Tables.USER_PERMISSIONS,
    timestamps: false
})

ClientsPermissions.hasMany(AdminPermission, {
    foreignKey: Columns.userPermissions.permission_id,
    sourceKey: Columns.clientsPermissions.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AdminPermission.belongsTo(ClientsPermissions, {
    foreignKey: Columns.userPermissions.permission_id,
    targetKey: Columns.clientsPermissions.id,
})

Admin.hasMany(AdminPermission, {
    foreignKey: Columns.userPermissions.user_id,
    sourceKey: Columns.admin.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AdminPermission.belongsTo(Admin, {
    foreignKey: Columns.userPermissions.user_id,
    targetKey: Columns.admin.id,
})

Client.hasMany(AdminPermission, {
    foreignKey: Columns.userPermissions.client_id,
    sourceKey: Columns.clients.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AdminPermission.belongsTo(Client, {
    foreignKey: Columns.userPermissions.client_id,
    targetKey: Columns.clients.id,
})


export = AdminPermission