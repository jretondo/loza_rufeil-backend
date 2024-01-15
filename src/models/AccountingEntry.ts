import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IAccountingEntries } from '../interfaces/Tables';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import AccountingPeriod from './AccountingPeriod';

type EntriesCreationAttributes = Optional<IAccountingEntries, 'id'>;

class AccountingEntries extends Model<IAccountingEntries, EntriesCreationAttributes> { }

AccountingEntries.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY
    },
    accounting_period_id: {
        type: DataTypes.INTEGER
    },
    description: {
        type: DataTypes.STRING
    },
    debit: {
        type: DataTypes.INTEGER
    },
    credit: {
        type: DataTypes.INTEGER
    },
    number: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    tableName: Tables.ENTRIES,
    timestamps: true
})

AccountingPeriod.hasMany(AccountingEntries, {
    foreignKey: Columns.accountingEntries.accounting_period_id,
    sourceKey: Columns.accountingPeriod.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AccountingEntries.belongsTo(AccountingPeriod, {
    foreignKey: Columns.accountingEntries.accounting_period_id,
    targetKey: Columns.accountingPeriod.id
})
AccountingEntries.sync({ alter: true })
export = AccountingEntries