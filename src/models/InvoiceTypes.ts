import { IInvoiceTypes } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Tables } from '../constant/TABLES';

type InvoiceTypeCreationAttributes = Optional<IInvoiceTypes, 'id'>;

class InvoiceType extends Model<IInvoiceTypes, InvoiceTypeCreationAttributes> { }

InvoiceType.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: false,
        primaryKey: true,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(120)
    },
    letter: {
        type: DataTypes.STRING(10)
    }
}, {
    sequelize,
    tableName: Tables.INVOICE_TYPES,
    timestamps: false
})

export = InvoiceType