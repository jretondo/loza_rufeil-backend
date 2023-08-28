import { Tables, Columns } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IClients } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import IvaCondition from './IvaCondition';

type ClientCreationAttributes = Optional<IClients, 'id'>;

class Client extends Model<IClients, ClientCreationAttributes> { }

Client.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    document_type: {
        type: DataTypes.INTEGER
    },
    document_number: {
        type: DataTypes.STRING
    },
    business_name: {
        type: DataTypes.STRING
    },
    fantasie_name: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    iva_condition_id: {
        type: DataTypes.INTEGER
    },
    direction: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    activity_description: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING
    }

}, {
    sequelize,
    tableName: Tables.CLIENTS,
    timestamps: true,
    indexes: [
        { fields: [Columns.clients.document_number], name: 'UQ_clients_documentNumber', unique: true }
    ]
})

IvaCondition.hasMany(Client, {
    foreignKey: Columns.clients.iva_condition_id,
    sourceKey: Columns.ivaConditions.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

Client.belongsTo(IvaCondition, {
    foreignKey: Columns.clients.iva_condition_id,
    targetKey: Columns.ivaConditions.id
})



export = Client