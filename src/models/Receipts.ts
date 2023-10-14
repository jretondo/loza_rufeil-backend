import { IReceipts } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Columns, Tables } from '../constant/TABLES';
import PurchasePeriod from './PurchasePeriod';
import { Restrictions } from 'constant/OTHERS';
import Provider from './Providers';

type ReceiptCreationAttributes = Optional<IReceipts, 'id'>;

class Receipt extends Model<IReceipts, ReceiptCreationAttributes> { }

Receipt.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE
    },
    invoice_type_id: {
        type: DataTypes.INTEGER
    },
    sell_point: {
        type: DataTypes.INTEGER
    },
    number: {
        type: DataTypes.INTEGER
    },
    total: {
        type: DataTypes.DECIMAL(12, 2)
    },
    unrecorded: {
        type: DataTypes.DECIMAL(12, 2)
    },
    exempt_transactions: {
        type: DataTypes.DECIMAL(12, 2)
    },
    vat_withholdings: {
        type: DataTypes.DECIMAL(12, 2)
    },
    national_tax_withholdings: {
        type: DataTypes.DECIMAL(12, 2)
    },
    gross_income_withholdings: {
        type: DataTypes.DECIMAL(12, 2)
    },
    local_tax_withholdings: {
        type: DataTypes.DECIMAL(12, 2)
    },
    internal_tax: {
        type: DataTypes.DECIMAL(12, 2)
    },
    vat_rates_quantity: {
        type: DataTypes.INTEGER
    },
    provider_id: {
        type: DataTypes.INTEGER
    },
    purchase_period_id: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    tableName: Tables.RECEIPTS,
    createdAt: true,
    updatedAt: true
})

PurchasePeriod.hasMany(Receipt, {
    foreignKey: Columns.receipts.purchase_period_id,
    sourceKey: Columns.purchasePeriods.id,
    onDelete: Restrictions.RESTRICT,
    onUpdate: Restrictions.RESTRICT
})

Receipt.belongsTo(PurchasePeriod, {
    foreignKey: Columns.receipts.purchase_period_id,
    targetKey: Columns.purchasePeriods.id
})

Provider.hasMany(Receipt, {
    foreignKey: Columns.receipts.provider_id,
    sourceKey: Columns.providers.id,
    onDelete: Restrictions.RESTRICT,
    onUpdate: Restrictions.RESTRICT
})

Receipt.belongsTo(Provider, {
    foreignKey: Columns.receipts.provider_id,
    targetKey: Columns.providers.id
})

export default Receipt