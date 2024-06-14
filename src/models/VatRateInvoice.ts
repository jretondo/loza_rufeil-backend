import { Restrictions } from '../constant/OTHERS';
import { Columns, Tables } from './../constant/TABLES';
import { IVatRatesReceipts } from "../interfaces/Tables";
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from '../database';
import Invoice from './Invoices';

type VatRateInvoiceCreationAttributes = Optional<IVatRatesReceipts, 'id'>;

class VatRateInvoice extends Model<IVatRatesReceipts, VatRateInvoiceCreationAttributes> { }

VatRateInvoice.init({
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
    tableName: Tables.VAT_RATES_INVOICES,
    timestamps: false
})

Invoice.hasMany(VatRateInvoice, {
    foreignKey: Columns.vatRateInvoice.invoice_id,
    sourceKey: Columns.receipts.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

VatRateInvoice.belongsTo(Invoice, {
    foreignKey: Columns.vatRateInvoice.invoice_id,
    targetKey: Columns.receipts.id
})

export default VatRateInvoice;