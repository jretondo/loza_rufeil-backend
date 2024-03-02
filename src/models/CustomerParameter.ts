import { Columns, Tables } from './../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { ICustomersParameters } from '../interfaces/Tables';
import sequelize from '../database';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
import AccountingPeriod from './AccountingPeriod';
import Customer from './Customers';

type CustomerParameterCreationAttributes = Optional<ICustomersParameters, 'id'>;

class CustomerParameter extends Model<ICustomersParameters, CustomerParameterCreationAttributes> { }

CustomerParameter.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
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
    tableName: Tables.CUSTOMERS_PARAMETERS,
    timestamps: false,
    sequelize
})

Customer.hasMany(CustomerParameter, {
    foreignKey: Columns.customersParameters.customer_id,
    sourceKey: Columns.providers.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

CustomerParameter.belongsTo(Customer, {
    foreignKey: Columns.customersParameters.customer_id,
    targetKey: Columns.providers.id
})

AccountChart.hasMany(CustomerParameter, {
    foreignKey: Columns.customersParameters.account_chart_id,
    sourceKey: Columns.accountCharts.id,
    onDelete: Restrictions.SET_NULL,
    onUpdate: Restrictions.SET_NULL,
});

CustomerParameter.belongsTo(AccountChart, {
    foreignKey: Columns.customersParameters.account_chart_id,
    targetKey: Columns.accountCharts.id
})

AccountingPeriod.hasOne(CustomerParameter, {
    foreignKey: Columns.customersParameters.accounting_period_id,
    sourceKey: Columns.accountingPeriod.id,
    onDelete: Restrictions.SET_NULL,
    onUpdate: Restrictions.SET_NULL,
});

CustomerParameter.belongsTo(AccountingPeriod, {
    foreignKey: Columns.customersParameters.accounting_period_id,
    targetKey: Columns.accountingPeriod.id
})

export default CustomerParameter