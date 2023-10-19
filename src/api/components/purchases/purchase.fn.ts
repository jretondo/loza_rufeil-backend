import roundNumber from "../../../utils/functions/roundNumber";
import { IHeaderReceiptReq, IPaymentReceiptReq, IProviders, IPurchaseEntries, IReceiptConcept, IReceipts, ITaxesReceiptReq, IVatRatesReceipts } from "../../../interfaces/Tables";

export const checkDataReqReceipt = (
    headerReceipt: IHeaderReceiptReq,
    paymentReceipt: IPaymentReceiptReq[],
    taxesReceipt: ITaxesReceiptReq[],
    receiptConcepts: IReceiptConcept[],
    provider: IProviders,
    purchasePeriodId: number,
    observations: string
) => {
    const { total } = headerReceipt
    const totalPayment = paymentReceipt.reduce((acc, payment) => acc + payment.amount, 0)
    const totalTaxes = taxesReceipt.reduce((acc, tax) => acc + tax.amount, 0)
    const totalConcepts = receiptConcepts.reduce((acc, concept) => acc + concept.amount, 0)

    const vatTaxes = taxesReceipt.filter(tax => tax.is_vat)

    if (total !== totalPayment || total !== (totalTaxes + totalConcepts)) {
        throw new Error("No se validan los totales!")
    }

    const totalUnrecordedConcepts = roundNumber(receiptConcepts.filter(concept => concept.recordType === 1).reduce((acc, concept) => acc + concept.amount, 0))

    const totalExemptTransactions = roundNumber(receiptConcepts.filter(concept => concept.recordType === 2).reduce((acc, concept) => acc + concept.amount, 0))

    const totalRecordedConcepts = roundNumber(receiptConcepts.filter(concept => concept.recordType === 0).reduce((acc, concept) => acc + concept.amount, 0))

    const totalVatWithholdings = roundNumber(taxesReceipt.filter(tax => tax.type === 12).reduce((acc, tax) => acc + tax.amount, 0))

    const totalNationalTax = roundNumber(taxesReceipt.filter(tax => tax.type === 13).reduce((acc, tax) => acc + tax.amount, 0))

    const totalGrossIncome = roundNumber(taxesReceipt.filter(tax => tax.type === 14).reduce((acc, tax) => acc + tax.amount, 0))

    const totalLocalTax = roundNumber(taxesReceipt.filter(tax => tax.type === 15).reduce((acc, tax) => acc + tax.amount, 0))

    const totalInternalTax = roundNumber(taxesReceipt.filter(tax => tax.type === 16).reduce((acc, tax) => acc + tax.amount, 0))

    const totalVatRecorded = roundNumber(taxesReceipt.filter(tax => tax.is_vat).reduce((acc, tax) => {
        switch (tax.type) {
            case 4:
                return acc + (tax.amount) / (0.105)
            case 5:
                return acc + (tax.amount) / (0.21)
            case 6:
                return acc + (tax.amount) / (0.27)
            case 8:
                return acc + (tax.amount) / (0.05)
            case 9:
                return acc + (tax.amount) / (0.025)
            default:
                break;
        }
        return acc + tax.amount
    }, 0))
    console.log('oundNumber(totalRecordedConcepts, 1) :>> ', roundNumber(totalRecordedConcepts, 1));
    console.log('oundNumber(totalVatRecorded, 1)) :>> ', roundNumber(totalVatRecorded, 1));
    if (vatTaxes.length > 0 && (roundNumber(totalRecordedConcepts, 1) !== roundNumber(totalVatRecorded, 1))) {
        throw new Error("No se validan los totales grabados!")
    }

    const receiptType = (): number => {
        switch ((String(headerReceipt.type.id)).concat(headerReceipt.word)) {
            case "1A":
                return 1;
            case "1B":
                return 6;
            case "1C":
                return 11;
            case "2A":
                return 4;
            case "2B":
                return 9;
            case "2C":
                return 15;
            case "3A":
                return 81;
            case "3B":
                return 82;
            case "3C":
                return 109;
            case "4A":
                return 3;
            case "4B":
                return 8;
            case "4C":
                return 13;
            case "5A":
                return 2;
            case "5B":
                return 7;
            case "5C":
                return 12;
            default:
                break;
        }
        return 0
    }

    const NewReceipt: IReceipts = {
        date: headerReceipt.date,
        invoice_type_id: receiptType(),
        sell_point: headerReceipt.sellPoint,
        number: headerReceipt.number,
        total: headerReceipt.total,
        unrecorded: totalUnrecordedConcepts, //No grabado
        exempt_transactions: totalExemptTransactions, //Operaciones exentas
        vat_withholdings: totalVatWithholdings, //Percepciones de IVA
        national_tax_withholdings: totalNationalTax, //Percepciones de impuestos nacionales
        gross_income_withholdings: totalGrossIncome, //Percepciones de ingresos brutos
        local_tax_withholdings: totalLocalTax, //Percepciones municipales
        internal_tax: totalInternalTax, //Impuestos internos
        vat_rates_quantity: vatTaxes.length, //Cantidad de alícuotas de IVA  
        provider_id: provider.id || 0,
        purchase_period_id: purchasePeriodId,
        observation: observations,
        word: headerReceipt.word,
        receipt_type: headerReceipt.type.id,
    }

    const VatRatesReceipts: IVatRatesReceipts[] = vatTaxes.map(tax => {
        const recorded = () => {
            switch (tax.type) {
                case 4:
                    return (tax.amount) / (0.105)
                case 5:
                    return (tax.amount) / (0.21)
                case 6:
                    return (tax.amount) / (0.27)
                case 8:
                    return (tax.amount) / (0.05)
                case 9:
                    return (tax.amount) / (0.025)
                default:
                    break;
            }
            return tax.amount
        }
        return {
            recorded_net: roundNumber(recorded()),
            vat_type_id: tax.type,
            vat_amount: tax.amount,
            receipt_id: 0
        }
    })

    const purchaseEntriesConcepts: IPurchaseEntries[] = receiptConcepts.map(concept => {
        return {
            date: headerReceipt.date,
            receipt_id: 0,
            account_chart_id: concept.account_chart_id,
            purchase_period_id: purchasePeriodId,
            description: concept.description,
            debit: concept.amount,
            credit: 0
        }
    })

    const purchaseEntriesTaxes: IPurchaseEntries[] = taxesReceipt.map(tax => {
        return {
            date: headerReceipt.date,
            receipt_id: 0,
            account_chart_id: tax.AccountChart?.id || null,
            purchase_period_id: purchasePeriodId,
            description: tax.name,
            debit: tax.amount,
            credit: 0
        }
    })

    const purchaseEntriesPayment: IPurchaseEntries[] = paymentReceipt.map(payment => {
        return {
            date: headerReceipt.date,
            receipt_id: 0,
            account_chart_id: payment.account_chart_id,
            purchase_period_id: purchasePeriodId,
            description: payment.name,
            debit: 0,
            credit: payment.amount
        }
    })

    const purchaseEntries: IPurchaseEntries[] = [...purchaseEntriesConcepts, ...purchaseEntriesTaxes, ...purchaseEntriesPayment]

    return { NewReceipt, VatRatesReceipts, purchaseEntries }
}

export const createReceiptReq = (
    headerReceipt: IHeaderReceiptReq,
    paymentReceipt: IPaymentReceiptReq[],
    taxesReceipt: ITaxesReceiptReq[],
    receiptConcepts: IReceiptConcept[]
) => {

}