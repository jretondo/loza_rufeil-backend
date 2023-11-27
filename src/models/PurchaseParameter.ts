import { Columns, Tables } from './../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { IPurchaseParameters } from './../interfaces/Tables';
import sequelize from '../database';
import Client from './Client';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
import AccountingPeriod from './AccountingPeriod';

type PurchaseParameterCreationAttributes = Optional<IPurchaseParameters, 'id'>;

class PurchaseParameter extends Model<IPurchaseParameters, PurchaseParameterCreationAttributes> { }

PurchaseParameter.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.TINYINT,
        allowNull: false

    },
    is_vat: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    account_chart_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    accounting_period_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_tax: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    sequelize,
    tableName: Tables.PURCHASE_PARAMETERS,
    timestamps: false
})

Client.hasOne(PurchaseParameter, {
    foreignKey: Columns.purchaseParameters.client_id,
    sourceKey: Columns.clients.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

PurchaseParameter.belongsTo(Client, {
    foreignKey: Columns.purchaseParameters.client_id,
    targetKey: Columns.clients.id
})

AccountChart.hasOne(PurchaseParameter, {
    foreignKey: Columns.purchaseParameters.account_chart_id,
    sourceKey: Columns.accountCharts.id,
    onDelete: Restrictions.SET_NULL,
    onUpdate: Restrictions.SET_NULL
})

PurchaseParameter.belongsTo(AccountChart, {
    foreignKey: Columns.purchaseParameters.account_chart_id,
    targetKey: Columns.accountCharts.id
})

AccountingPeriod.hasOne(PurchaseParameter, {
    foreignKey: Columns.purchaseParameters.accounting_period_id,
    sourceKey: Columns.accountingPeriod.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

PurchaseParameter.belongsTo(AccountingPeriod, {
    foreignKey: Columns.purchaseParameters.accounting_period_id,
    targetKey: Columns.accountingPeriod.id
})

export default PurchaseParameter;