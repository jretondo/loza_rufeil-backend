import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import { IAccountCharts } from '../interfaces/Tables';
import AccountingPeriod from './AccountingPeriod';

type AccountChartsCreationAttributes = Optional<IAccountCharts, 'id'>;

class AccountChart extends Model<IAccountCharts, AccountChartsCreationAttributes> { }

AccountChart.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    genre: {
        type: DataTypes.INTEGER
    },
    group: {
        type: DataTypes.INTEGER
    },
    caption: {
        type: DataTypes.INTEGER
    },
    account: {
        type: DataTypes.INTEGER
    },
    sub_account: {
        type: DataTypes.INTEGER
    },
    code: {
        type: DataTypes.STRING
    },
    name: {
        type: DataTypes.STRING
    },
    attributable: {
        type: DataTypes.BOOLEAN
    },
    inflation_adjustment: {
        type: DataTypes.BOOLEAN
    },
    accounting_period_id: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    tableName: Tables.ACCOUNT_CHARTS,
    timestamps: false
})

AccountingPeriod.hasOne(AccountChart, {
    foreignKey: Columns.accountCharts.accounting_period_id,
    sourceKey: Columns.accountingPeriod.id,
    onDelete: Restrictions.RESTRICT,
    onUpdate: Restrictions.RESTRICT
})

AccountChart.belongsTo(AccountingPeriod, {
    foreignKey: Columns.accountCharts.accounting_period_id,
    targetKey: Columns.accountingPeriod.id
})

export = AccountChart