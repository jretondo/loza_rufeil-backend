import { Tables, Columns } from '../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { IPointsSells } from '../interfaces/Tables';
import sequelize from '../database';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
import AccountingPeriod from './AccountingPeriod';
import Client from './Client';

type PointsSellsCreationAttributes = Optional<IPointsSells, 'id'>;

class PointsSells extends Model<IPointsSells, PointsSellsCreationAttributes> {}

PointsSells.init(
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
    number: {
      type: DataTypes.INTEGER,
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
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: Tables.POINTS_SELLS_PARAMETERS,
    timestamps: false,
    sequelize,
  },
);

Client.hasOne(PointsSells, {
  foreignKey: Columns.sellPoints.client_id,
  sourceKey: Columns.clients.id,
  onDelete: Restrictions.CASCADE,
  onUpdate: Restrictions.CASCADE,
});

PointsSells.belongsTo(Client, {
  foreignKey: Columns.sellPoints.client_id,
  targetKey: Columns.clients.id,
});

AccountChart.hasOne(PointsSells, {
  foreignKey: Columns.sellPoints.account_chart_id,
  sourceKey: Columns.accountCharts.id,
  onDelete: Restrictions.SET_NULL,
  onUpdate: Restrictions.SET_NULL,
});

PointsSells.belongsTo(AccountChart, {
  foreignKey: Columns.sellPoints.account_chart_id,
  targetKey: Columns.accountCharts.id,
});

AccountingPeriod.hasOne(PointsSells, {
  foreignKey: Columns.sellPoints.accounting_period_id,
  sourceKey: Columns.accountingPeriod.id,
  onDelete: Restrictions.CASCADE,
  onUpdate: Restrictions.CASCADE,
});

PointsSells.belongsTo(AccountingPeriod, {
  foreignKey: Columns.sellPoints.accounting_period_id,
  targetKey: Columns.accountingPeriod.id,
});

export default PointsSells;
