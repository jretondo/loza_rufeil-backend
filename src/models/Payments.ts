import { Columns, Tables } from './../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import { IPayments } from './../interfaces/Tables';
import sequelize from '../database';
import { Restrictions } from '../constant/OTHERS';
import Customer from './Customers';
import Invoice from './Invoices';
import PointsSells from './PointsSells';

type PaymentsCreationAttributes = Optional<IPayments, 'id'>;

class Payments extends Model<IPayments, PaymentsCreationAttributes> {}

Payments.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    pv_id: {
      type: DataTypes.INTEGER,
    },
    number: {
      type: DataTypes.INTEGER,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
    },
    observation: {
      type: DataTypes.STRING,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
    tableName: Tables.PAYMENTS,
    timestamps: false,
  },
);

Customer.hasMany(Payments, {
  foreignKey: Columns.payments.customer_id,
  sourceKey: Columns.customers.id,
  onDelete: Restrictions.CASCADE,
  onUpdate: Restrictions.CASCADE,
});

Payments.belongsTo(Customer, {
  foreignKey: Columns.payments.customer_id,
  targetKey: Columns.customers.id,
});

Invoice.hasMany(Payments, {
  foreignKey: Columns.payments.invoice_id,
  sourceKey: Columns.invoices.id,
  onDelete: Restrictions.SET_NULL,
  onUpdate: Restrictions.SET_NULL,
});

Payments.belongsTo(Invoice, {
  foreignKey: Columns.payments.invoice_id,
  targetKey: Columns.invoices.id,
});

PointsSells.hasMany(Payments, {
  foreignKey: Columns.payments.pv_id,
  sourceKey: Columns.sellPoints.id,
  onDelete: Restrictions.SET_NULL,
  onUpdate: Restrictions.SET_NULL,
});

Payments.belongsTo(PointsSells, {
  foreignKey: Columns.payments.pv_id,
  targetKey: Columns.sellPoints.id,
});

export default Payments;
