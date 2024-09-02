import { DataTypes, Model, Optional } from 'sequelize';
import { ISellsDefaultParameters } from '../interfaces/Tables';
import { Columns, Tables } from '../constant/TABLES';
import sequelize from '../database';
import Client from './Client';
import AccountChart from './AccountCharts';
import AccountingPeriod from './AccountingPeriod';
import { Restrictions } from '../constant/OTHERS';

type SellsDefaultParametersCreationAttributes = Optional<
  ISellsDefaultParameters,
  'id'
>;

class SellsDefaultParameters extends Model<
  ISellsDefaultParameters,
  SellsDefaultParametersCreationAttributes
> {}

SellsDefaultParameters.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    account_chart_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    accounting_period_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: Tables.SELLS_DEFAULT_PARAMETERS,
    timestamps: false,
  },
);

Client.hasOne(SellsDefaultParameters, {
  foreignKey: Columns.sellsDefaultParameters.client_id,
  sourceKey: Columns.clients.id,
  onDelete: Restrictions.CASCADE,
  onUpdate: Restrictions.CASCADE,
});

SellsDefaultParameters.belongsTo(Client, {
  foreignKey: Columns.sellsDefaultParameters.client_id,
  targetKey: Columns.clients.id,
});

AccountChart.hasOne(SellsDefaultParameters, {
  foreignKey: Columns.sellsDefaultParameters.account_chart_id,
  sourceKey: Columns.accountCharts.id,
  onDelete: Restrictions.SET_NULL,
  onUpdate: Restrictions.SET_NULL,
});

SellsDefaultParameters.belongsTo(AccountChart, {
  foreignKey: Columns.sellsDefaultParameters.account_chart_id,
  targetKey: Columns.accountCharts.id,
});

AccountingPeriod.hasOne(SellsDefaultParameters, {
  foreignKey: Columns.sellsDefaultParameters.accounting_period_id,
  sourceKey: Columns.accountingPeriod.id,
  onDelete: Restrictions.CASCADE,
  onUpdate: Restrictions.CASCADE,
});

SellsDefaultParameters.belongsTo(AccountingPeriod, {
  foreignKey: Columns.sellsDefaultParameters.accounting_period_id,
  targetKey: Columns.accountingPeriod.id,
});

export default SellsDefaultParameters;
