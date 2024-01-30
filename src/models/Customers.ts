import { Tables, Columns } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { ICostumers } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import IvaCondition from './IvaCondition';

type CustomerCreationAttributes = Optional<ICostumers, 'id'>;

class Customer extends Model<ICostumers, CustomerCreationAttributes> { }

Customer.init({
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
    tableName: Tables.CUSTOMERS,
    timestamps: true,
    indexes: [
        { fields: [Columns.customers.document_number], name: 'UQ_clients_documentNumber', unique: true }
    ]
})

IvaCondition.hasMany(Customer, {
    foreignKey: Columns.customers.iva_condition_id,
    sourceKey: Columns.ivaConditions.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

Customer.belongsTo(IvaCondition, {
    foreignKey: Columns.customers.iva_condition_id,
    targetKey: Columns.ivaConditions.id
})

export = Customer