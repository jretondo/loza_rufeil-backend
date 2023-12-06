import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IAdminPermission } from '../interfaces/Tables';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import Admin from './Admin';
import Client from './Client';
import Module from './Module';

type AdminPermissionCreationAttributes = Optional<IAdminPermission, 'id'>;

class AdminPermission extends Model<IAdminPermission, AdminPermissionCreationAttributes> { }

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
    client_id: {
        type: DataTypes.INTEGER
    },
    permission_grade_id: {
        type: DataTypes.INTEGER
    },
    module_id: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    tableName: Tables.ADMIN_PERMISSIONS,
    timestamps: false
})

Admin.hasMany(AdminPermission, {
    foreignKey: Columns.adminPermissions.user_id,
    sourceKey: Columns.admin.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AdminPermission.belongsTo(Admin, {
    foreignKey: Columns.adminPermissions.user_id,
    targetKey: Columns.admin.id,
})

Client.hasMany(AdminPermission, {
    foreignKey: Columns.adminPermissions.client_id,
    sourceKey: Columns.clients.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AdminPermission.belongsTo(Client, {
    foreignKey: Columns.adminPermissions.client_id,
    targetKey: Columns.clients.id,
})

Module.hasMany(AdminPermission, {
    foreignKey: Columns.adminPermissions.module_id,
    sourceKey: Columns.modules.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AdminPermission.belongsTo(Module, {
    foreignKey: Columns.adminPermissions.module_id,
    targetKey: Columns.modules.id,
})

export = AdminPermission