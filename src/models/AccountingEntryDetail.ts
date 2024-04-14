import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IAccountingEntryDetail } from '../interfaces/Tables';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import AccountingEntries from './AccountingEntry';
import AccountChart from './AccountCharts';

type EntriesDetailsCreationAttributes = Optional<IAccountingEntryDetail, 'id'>;

class AccountingEntriesDetails extends Model<IAccountingEntryDetail, EntriesDetailsCreationAttributes> { }

AccountingEntriesDetails.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    account_chart_id: {
        type: DataTypes.INTEGER
    },
    debit: {
        type: DataTypes.DECIMAL(12, 2),
    },
    credit: {
        type: DataTypes.DECIMAL(12, 2),
    },
    accounting_entry_id: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    tableName: Tables.ENTRIES_DETAILS,
    timestamps: true
})

AccountChart.hasMany(AccountingEntriesDetails, {
    foreignKey: Columns.accountingEntriesDetails.account_chart_id,
    sourceKey: Columns.accountCharts.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AccountingEntriesDetails.belongsTo(AccountChart, {
    foreignKey: Columns.accountingEntriesDetails.account_chart_id,
    targetKey: Columns.accountCharts.id
})

AccountingEntries.hasMany(AccountingEntriesDetails, {
    foreignKey: Columns.accountingEntriesDetails.accounting_entry_id,
    sourceKey: Columns.accountingEntries.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AccountingEntriesDetails.belongsTo(AccountingEntries, {
    foreignKey: Columns.accountingEntriesDetails.accounting_entry_id,
    targetKey: Columns.accountingEntries.id
})

export default AccountingEntriesDetails