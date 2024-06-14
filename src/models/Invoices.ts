import { IInvoices } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import Customer from './Customers';
import SellPeriod from './SellPeriod';

type InvoiceCreationAttributes = Optional<IInvoices, 'id'>;

class Invoice extends Model<IInvoices, InvoiceCreationAttributes> { }

Invoice.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE
    },
    invoice_type_id: {
        type: DataTypes.INTEGER
    },
    sell_point: {
        type: DataTypes.INTEGER
    },
    number: {
        type: DataTypes.INTEGER
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    unrecorded: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    exempt_transactions: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    vat_withholdings: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    national_tax_withholdings: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    gross_income_withholdings: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    local_tax_withholdings: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    internal_tax: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    vat_rates_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    customer_id: {
        type: DataTypes.INTEGER
    },
    sell_period_id: {
        type: DataTypes.INTEGER
    },
    observation: {
        type: DataTypes.TEXT('long')
    },
    word: {
        type: DataTypes.CHAR(1)
    },
    receipt_type: {
        type: DataTypes.TINYINT
    }
}, {
    sequelize,
    tableName: Tables.INVOICES,
    createdAt: true,
    updatedAt: true
})

SellPeriod.hasMany(Invoice, {
    foreignKey: Columns.invoices.sell_period_id,
    sourceKey: Columns.sellPeriods.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

Invoice.belongsTo(SellPeriod, {
    foreignKey: Columns.invoices.sell_period_id,
    targetKey: Columns.sellPeriods.id
})

Customer.hasMany(Invoice, {
    foreignKey: Columns.invoices.customer_id,
    sourceKey: Columns.providers.id,
    onDelete: Restrictions.RESTRICT,
    onUpdate: Restrictions.RESTRICT
})

Invoice.belongsTo(Customer, {
    foreignKey: Columns.invoices.customer_id,
    targetKey: Columns.providers.id
})

export default Invoice