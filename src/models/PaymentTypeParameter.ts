import { Tables, Columns } from '../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { IPaymentTypesParameters } from '../interfaces/Tables';
import sequelize from '../database';
import Client from './Client';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
import AccountingPeriod from './AccountingPeriod';
type PaymentTypeParameterCreationAttributes = Optional<IPaymentTypesParameters, 'id'>;

class PaymentTypeParameter extends Model<IPaymentTypesParameters, PaymentTypeParameterCreationAttributes> { }

PaymentTypeParameter.init({
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
    name: {
        type: DataTypes.STRING,
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
    }
}, {
    tableName: Tables.PAYMENT_TYPES_PARAMETERS,
    timestamps: false,
    sequelize
})

Client.hasOne(PaymentTypeParameter, {
    foreignKey: Columns.paymentTypesParameters.client_id,
    sourceKey: Columns.clients.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

PaymentTypeParameter.belongsTo(Client, {
    foreignKey: Columns.paymentTypesParameters.client_id,
    targetKey: Columns.clients.id
})

AccountChart.hasOne(PaymentTypeParameter, {
    foreignKey: Columns.paymentTypesParameters.account_chart_id,
    sourceKey: Columns.accountCharts.id,
    onDelete: Restrictions.SET_NULL,
    onUpdate: Restrictions.SET_NULL
})

PaymentTypeParameter.belongsTo(AccountChart, {
    foreignKey: Columns.paymentTypesParameters.account_chart_id,
    targetKey: Columns.accountCharts.id
})

AccountingPeriod.hasOne(PaymentTypeParameter, {
    foreignKey: Columns.paymentTypesParameters.accounting_period_id,
    sourceKey: Columns.accountingPeriod.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

PaymentTypeParameter.belongsTo(AccountingPeriod, {
    foreignKey: Columns.paymentTypesParameters.accounting_period_id,
    targetKey: Columns.accountingPeriod.id
})

PaymentTypeParameter.sync({ alter: true })
export default PaymentTypeParameter