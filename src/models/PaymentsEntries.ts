import { Columns, Tables } from './../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { IPaymentEntries } from '../interfaces/Tables';
import sequelize from '../database';
import { Restrictions } from '../constant/OTHERS';
import AccountChart from './AccountCharts';
import Payments from './Payments';
type PaymentEntryEntryCreationAttributes = Optional<IPaymentEntries, 'id'>;

class PaymentEntry extends Model<
  IPaymentEntries,
  PaymentEntryEntryCreationAttributes
> {}

PaymentEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
    },
    payment_id: {
      type: DataTypes.INTEGER,
    },
    account_chart_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
    },
    debit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    credit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: Tables.PAYMENTS_ENTRIES,
    timestamps: false,
  },
);

Payments.hasMany(PaymentEntry, {
  foreignKey: Columns.paymentsEntries.payment_id,
  sourceKey: Columns.payments.id,
  onDelete: Restrictions.CASCADE,
  onUpdate: Restrictions.CASCADE,
});

PaymentEntry.belongsTo(Payments, {
  foreignKey: Columns.paymentsEntries.payment_id,
  targetKey: Columns.payments.id,
});

AccountChart.hasMany(PaymentEntry, {
  foreignKey: Columns.sellEntries.account_chart_id,
  sourceKey: Columns.accountCharts.id,
  onDelete: Restrictions.SET_NULL,
  onUpdate: Restrictions.SET_NULL,
});

PaymentEntry.belongsTo(AccountChart, {
  foreignKey: Columns.sellEntries.account_chart_id,
  targetKey: Columns.accountCharts.id,
});

export default PaymentEntry;
