import { IClientsPermissions } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Columns, Tables } from '../constant/TABLES';
import AdminPermission from './AdminPermission';
import { Restrictions } from '../constant/OTHERS';

type ClientsPermissionsCreationAttributes = Optional<IClientsPermissions, 'id'>;

class ClientsPermissions extends Model<IClientsPermissions, ClientsPermissionsCreationAttributes> { }

ClientsPermissions.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(200)
    }
}, {
    sequelize,
    tableName: Tables.CLIENTS_PERMISSIONS,
    timestamps: false
})

export = ClientsPermissions