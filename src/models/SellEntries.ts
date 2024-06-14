import { Columns, Tables } from './../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import {  ISellsEntries } from '../interfaces/Tables';
import sequelize from '../database';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
import Invoice from './Invoices';
type SellEntryCreationAttributes = Optional<ISellsEntries, 'id'>;

class SellEntry extends Model<ISellsEntries, SellEntryCreationAttributes> { }

SellEntry.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE
    },
    invoice_id: {
        type: DataTypes.INTEGER
    },
    account_chart_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING
    },
    debit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    credit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    }
}, {
    sequelize,
    tableName: Tables.SELL_ENTRIES,
    timestamps: false
});

Invoice.hasMany(SellEntry, {
    foreignKey: Columns.sellEntries.invoice_id,
    sourceKey: Columns.invoices.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

SellEntry.belongsTo(Invoice, {
    foreignKey: Columns.sellEntries.invoice_id,
    targetKey: Columns.invoices.id
})

AccountChart.hasMany(SellEntry, {
    foreignKey: Columns.sellEntries.account_chart_id,
    sourceKey: Columns.accountCharts.id,
    onDelete: Restrictions.SET_NULL,
    onUpdate: Restrictions.SET_NULL
})

SellEntry.belongsTo(AccountChart, {
    foreignKey: Columns.sellEntries.account_chart_id,
    targetKey: Columns.accountCharts.id
})

export default SellEntry;