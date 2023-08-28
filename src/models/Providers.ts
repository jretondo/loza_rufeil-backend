import { Tables, Columns } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IProviders } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import IvaCondition from './IvaCondition';
import Client from './Client';

type ProviderCreationAttributes = Optional<IProviders, 'id'>;

class Provider extends Model<IProviders, ProviderCreationAttributes> { }

Provider.init({
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
    iva_condition_id: {
        type: DataTypes.INTEGER
    },
    direction: {
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
    tableName: Tables.PROVIDERS,
    timestamps: true,
    indexes: [
        { fields: [Columns.clients.document_number], name: 'UQ_clients_documentNumber', unique: true }
    ]
})

IvaCondition.hasMany(Provider, {
    foreignKey: Columns.providers.iva_condition_id,
    sourceKey: Columns.ivaConditions.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

Provider.belongsTo(IvaCondition, {
    foreignKey: Columns.providers.iva_condition_id,
    targetKey: Columns.ivaConditions.id
})

export = Provider