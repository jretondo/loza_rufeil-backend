import { IAccountingPeriod } from './../interfaces/Tables';
import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import Client from './Client';

type AccountingPeriodCreationAttributes = Optional<IAccountingPeriod, 'id'>;

class AccountingPeriod extends Model<IAccountingPeriod, AccountingPeriodCreationAttributes> { }

AccountingPeriod.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    from_date: {
        type: DataTypes.DATEONLY
    },
    to_date: {
        type: DataTypes.DATEONLY
    },
    client_id: {
        type: DataTypes.INTEGER
    },
    closed: {
        type: DataTypes.BOOLEAN
    }
}, {
    sequelize,
    tableName: Tables.ACCOUNTING_PERIOD,
    timestamps: false
})


Client.hasOne(AccountingPeriod, {
    foreignKey: Columns.accountingPeriod.client_id,
    sourceKey: Columns.clients.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

AccountingPeriod.belongsTo(Client, {
    foreignKey: Columns.accountingPeriod.client_id,
    targetKey: Columns.clients.id
})

export = AccountingPeriod