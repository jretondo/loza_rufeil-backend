import { Restrictions } from '../constant/OTHERS';
import { Columns, Tables } from './../constant/TABLES';
import { IVatRatesReceipts } from "../interfaces/Tables";
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../database';
import Receipt from './Receipts';

type VatRateReceiptCreationAttributes = Optional<IVatRatesReceipts, 'id'>;

class VatRateReceipt extends Model<IVatRatesReceipts, VatRateReceiptCreationAttributes> { }

VatRateReceipt.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    receipt_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    recorded_net: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    vat_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    vat_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    }
}, {
    sequelize,
    tableName: Tables.VAT_RATES_RECEIPTS,
    timestamps: false
})

Receipt.hasMany(VatRateReceipt, {
    foreignKey: Columns.vatRatePurchase.receipt_id,
    sourceKey: Columns.receipts.id,
    onDelete: Restrictions.RESTRICT,
    onUpdate: Restrictions.RESTRICT
})

VatRateReceipt.belongsTo(Receipt, {
    foreignKey: Columns.vatRatePurchase.receipt_id,
    targetKey: Columns.receipts.id
})

export default VatRateReceipt;