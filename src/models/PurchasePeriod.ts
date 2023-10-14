import { DataTypes, Model, Optional } from 'sequelize';
import { IPurchasePeriods } from '../interfaces/Tables';
import sequelize from '../database';
import { Columns, Tables } from '../constant/TABLES';
import AccountingPeriod from './AccountingPeriod';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';

type PurchasePeriodCreationAttributes = Optional<IPurchasePeriods, 'id'>;

class PurchasePeriod extends Model<IPurchasePeriods, PurchasePeriodCreationAttributes> { }

PurchasePeriod.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    accounting_period_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    closed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    tableName: Tables.PURCHASE_PERIODS,
    timestamps: false,
    indexes: [{ fields: [Columns.purchasePeriods.month, Columns.purchasePeriods.year], name: 'UQ_month_year', unique: true },]

})

AccountingPeriod.hasMany(PurchasePeriod, {
    foreignKey: Columns.purchasePeriods.accounting_period_id,
    sourceKey: Columns.accountingPeriod.id,
    onDelete: Restrictions.RESTRICT,
    onUpdate: Restrictions.RESTRICT
})

PurchasePeriod.belongsTo(AccountingPeriod, {
    foreignKey: Columns.purchasePeriods.accounting_period_id,
    targetKey: Columns.accountingPeriod.id
})

AccountChart.hasOne(AccountingPeriod, {
    foreignKey: Columns.paymentTypesParameters.account_chart_id,
    sourceKey: Columns.accountCharts.id,
    onDelete: Restrictions.RESTRICT,
    onUpdate: Restrictions.RESTRICT
})

AccountingPeriod.belongsTo(AccountChart, {
    foreignKey: Columns.paymentTypesParameters.account_chart_id,
    targetKey: Columns.accountCharts.id
})

export default PurchasePeriod;