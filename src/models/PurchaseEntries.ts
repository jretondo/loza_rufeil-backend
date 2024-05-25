import { Columns, Tables } from './../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { IPurchaseEntries } from '../interfaces/Tables';
import sequelize from '../database';
import Receipt from './Receipts';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
type PurchaseEntryCreationAttributes = Optional<IPurchaseEntries, 'id'>;

class PurchaseEntry extends Model<IPurchaseEntries, PurchaseEntryCreationAttributes> { }

PurchaseEntry.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE
    },
    receipt_id: {
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
    tableName: Tables.PURCHASE_ENTRIES,
    timestamps: false
});

Receipt.hasMany(PurchaseEntry, {
    foreignKey: Columns.purchaseEntries.receipt_id,
    sourceKey: Columns.receipts.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

PurchaseEntry.belongsTo(Receipt, {
    foreignKey: Columns.purchaseEntries.receipt_id,
    targetKey: Columns.receipts.id
})

AccountChart.hasMany(PurchaseEntry, {
    foreignKey: Columns.purchaseEntries.account_chart_id,
    sourceKey: Columns.accountCharts.id,
    onDelete: Restrictions.SET_NULL,
    onUpdate: Restrictions.SET_NULL
})

PurchaseEntry.belongsTo(AccountChart, {
    foreignKey: Columns.purchaseEntries.account_chart_id,
    targetKey: Columns.accountCharts.id
})

export default PurchaseEntry;