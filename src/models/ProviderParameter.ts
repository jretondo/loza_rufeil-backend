import { Columns, Tables } from './../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { IProvidersParameters } from '../interfaces/Tables';
import sequelize from '../database';
import Provider from './Providers';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
import AccountingPeriod from './AccountingPeriod';

type ProviderParameterCreationAttributes = Optional<IProvidersParameters, 'id'>;

class ProviderParameter extends Model<IProvidersParameters, ProviderParameterCreationAttributes> { }

ProviderParameter.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    provider_id: {
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
    tableName: Tables.PROVIDERS_PARAMETERS,
    timestamps: false,
    sequelize
})

Provider.hasMany(ProviderParameter, {
    foreignKey: Columns.providersParameters.provider_id,
    sourceKey: Columns.providers.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

ProviderParameter.belongsTo(Provider, {
    foreignKey: Columns.providersParameters.provider_id,
    targetKey: Columns.providers.id
})

AccountChart.hasMany(ProviderParameter, {
  foreignKey: Columns.providersParameters.account_chart_id,
  sourceKey: Columns.accountCharts.id,
  onDelete: Restrictions.SET_NULL,
  onUpdate: Restrictions.SET_NULL,
});

ProviderParameter.belongsTo(AccountChart, {
    foreignKey: Columns.providersParameters.account_chart_id,
    targetKey: Columns.accountCharts.id
})

AccountingPeriod.hasOne(ProviderParameter, {
  foreignKey: Columns.providersParameters.accounting_period_id,
  sourceKey: Columns.accountingPeriod.id,
  onDelete: Restrictions.SET_NULL,
  onUpdate: Restrictions.SET_NULL,
});

ProviderParameter.belongsTo(AccountingPeriod, {
    foreignKey: Columns.providersParameters.accounting_period_id,
    targetKey: Columns.accountingPeriod.id
})

export default ProviderParameter