import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IClientsModules } from '../interfaces/Tables';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import Client from './Client';
import Module from './Module';

type ClientPermissionCreationAttributes = Optional<IClientsModules, 'id'>;

class ClientPermission extends Model<IClientsModules, ClientPermissionCreationAttributes> { }

ClientPermission.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    client_id: {
        type: DataTypes.INTEGER
    },
    module_id: {
        type: DataTypes.INTEGER
    },
    active: {
        type: DataTypes.BOOLEAN
    }
}, {
    sequelize,
    tableName: Tables.CLIENTS_PERMISSIONS,
    timestamps: false
})

Client.hasMany(ClientPermission, {
    foreignKey: Columns.clientsPermissions.client_id,
    sourceKey: Columns.clients.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

ClientPermission.belongsTo(Client, {
    foreignKey: Columns.clientsPermissions.client_id,
    targetKey: Columns.clients.id,
})

Module.hasMany(ClientPermission, {
    foreignKey: Columns.clientsPermissions.module_id,
    sourceKey: Columns.modules.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

ClientPermission.belongsTo(Module, {
    foreignKey: Columns.clientsPermissions.module_id,
    targetKey: Columns.modules.id,
})

export = ClientPermission