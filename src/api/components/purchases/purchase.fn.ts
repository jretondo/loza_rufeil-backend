import roundNumber from "../../../utils/functions/roundNumber";
import { IHeaderReceiptReq, IPaymentReceiptReq, IProviders, IPurchaseEntries, IReceiptConcept, IReceipts, ITaxesReceiptReq, IVatRatesReceipts } from "../../../interfaces/Tables";
import Receipt from "../../../models/Receipts";
import moment from "moment";
import { stringFill } from "../../../utils/functions/stringFill";
import XLSX from 'xlsx';
import { IDataSheetCVSPurchaseImport } from "../../../interfaces/Others";
import utf8 from "utf8";
import { ExcelDateToJSDate } from "../../../utils/functions/excelDateToDate";

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

export const createPurchaseTxtItems = (purchaseItems: Receipt[]) => {
    let text = ""
    purchaseItems.forEach((purchase, key) => {
        if (key === purchaseItems.length - 1) {
            text += createPurchaseTxtItem(purchase)
        } else {
            text += createPurchaseTxtItem(purchase) + "\n"
        }
    })
    return text
}

export const createPurchaseTxtItem = (purchaseItems: Receipt) => {
    const date = stringFill(moment(purchaseItems.dataValues.date).format("YYYYMMDD"), 8)
    const receiptType = stringFill(purchaseItems.dataValues.invoice_type_id.toString(), 3)
    const sellPoint = stringFill(purchaseItems.dataValues.sell_point.toString(), 5)
    const number = stringFill(purchaseItems.dataValues.number.toString(), 20)
    const importClearance = stringFill(" ", 16, " ")
    const providerDocType = stringFill(purchaseItems.dataValues.Provider?.document_type.toString() || "", 2)
    const providerNumber = stringFill(purchaseItems.dataValues.Provider?.document_number.toString() || "", 20)
    const providerName = stringFill(purchaseItems.dataValues.Provider?.business_name || "".toString(), 30, " ", false)
    const total =
        stringFill((stringFill(purchaseItems.dataValues.total.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.total.toString().split(".")[1], 2)), 15, "0", false)
    const unrecorded =
        stringFill((stringFill(purchaseItems.dataValues.unrecorded.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.unrecorded.toString().split(".")[1], 2)), 15, "0", false)
    const exemptTransactions =
        stringFill((stringFill(purchaseItems.dataValues.exempt_transactions.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.exempt_transactions.toString().split(".")[1], 2)), 15, "0", false)
    const vatWithholdings =
        stringFill((stringFill(purchaseItems.dataValues.vat_withholdings.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.vat_withholdings.toString().split(".")[1], 2)), 15, "0", false)
    const nationalTaxWithholdings =
        stringFill((stringFill(purchaseItems.dataValues.national_tax_withholdings.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.national_tax_withholdings.toString().split(".")[1], 2)), 15, "0", false)
    const grossIncomeWithholdings =
        stringFill((stringFill(purchaseItems.dataValues.gross_income_withholdings.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.gross_income_withholdings.toString().split(".")[1], 2)), 15, "0", false)
    const localTaxWithholdings =
        stringFill((stringFill(purchaseItems.dataValues.local_tax_withholdings.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.local_tax_withholdings.toString().split(".")[1], 2)), 15, "0", false)
    const internalTax =
        stringFill((stringFill(purchaseItems.dataValues.internal_tax.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.internal_tax.toString().split(".")[1], 2)), 15, "0", false)

    const moneyCode = stringFill("PES", 3)
    const exchangeRate = stringFill("1000000", 10)
    const vatRatesQuantity = stringFill(purchaseItems.dataValues.vat_rates_quantity.toString(), 1)
    const operationCode = stringFill(" ", 1)
    const fiscalCredit = stringFill("0", 15)
    const otherTributes = stringFill("0", 15)
    const brokerDocument = stringFill("0", 11)
    const brokerName = stringFill(" ", 30, " ")
    const commissionVat = stringFill("0", 15)
    const row = `${date}${receiptType}${sellPoint}${number}${importClearance}${providerDocType}${providerNumber}${providerName}${total}${unrecorded}${exemptTransactions}${vatWithholdings}${nationalTaxWithholdings}${grossIncomeWithholdings}${localTaxWithholdings}${internalTax}${moneyCode}${exchangeRate}${vatRatesQuantity}${operationCode}${fiscalCredit}${otherTributes}${brokerDocument}${brokerName}${commissionVat}`
    return row
}

export const createPurchaseTxtVatRates = (purchaseItems: Receipt[]) => {
    let text = ""
    purchaseItems.forEach((purchase, key) => {
        if (key === purchaseItems.length - 1) {
            text += createPurchaseTxtVatRateItem(purchase)
        } else {
            text += createPurchaseTxtVatRateItem(purchase) + "\n"
        }
    })
    return text
}

export const createPurchaseTxtVatRateItem = (purchaseItems: Receipt) => {
    const vatRates = purchaseItems.dataValues.VatRatesReceipts
    if (!vatRates) {
        return []
    }
    return vatRates.map(vatRate => {
        const receiptType = stringFill(purchaseItems.dataValues.invoice_type_id.toString(), 3)
        const sellPoint = stringFill(purchaseItems.dataValues.sell_point.toString(), 5)
        const number = stringFill(purchaseItems.dataValues.number.toString(), 20)
        const providerDocType = stringFill(purchaseItems.dataValues.Provider?.document_type.toString() || "", 2)
        const providerNumber = stringFill(purchaseItems.dataValues.Provider?.document_number.toString() || "", 20)
        const recordedNet =
            stringFill((stringFill(vatRate.recorded_net.toString().split(".")[0], 13) +
                stringFill(vatRate.recorded_net.toString().split(".")[1], 2)), 15, "0", false)
        const vatType = stringFill(vatRate.vat_type_id.toString(), 4)
        const vatAmount =
            stringFill((stringFill(vatRate.vat_amount.toString().split(".")[0], 13) +
                stringFill(vatRate.vat_amount.toString().split(".")[1], 2)), 15, "0", false)
        const row = `${receiptType}${sellPoint}${number}${providerDocType}${providerNumber}${recordedNet}${vatType}${vatAmount}`
        return row
    })
}

export const getDataSheet = (fileUrl: string): any => {
    const workBook = XLSX.readFile(fileUrl)
    const sheets = workBook.SheetNames;
    const sheet_1 = sheets[0]
    return XLSX.utils.sheet_to_json(workBook.Sheets[sheet_1], { header: 1, raw: false, dateNF: "DD/MM/YYYY", rawNumbers: false })
}

export const jsonDataInvoiceGenerator = (dataSheet: Array<string[]>): IDataSheetCVSPurchaseImport[] => {
    try {
        const data = dataSheet.slice(1)
        const jsonData = data.map((row: any) => {
            const rowObject: any = {}
            rowObject["date"] = moment(new Date(row[0]).setDate(new Date(row[0]).getDate() + 1)).format("YYYY-MM-DD")
            rowObject["invoiceType"] = row[1]
            rowObject["sellPoint"] = row[2]
            rowObject["invoiceNumber"] = row[3]
            rowObject["cae"] = row[5]
            rowObject["providerDocumentType"] = row[6]
            rowObject["providerDocumentNumber"] = row[7]
            rowObject["providerName"] = row[8]
            rowObject["changeType"] = row[9]
            rowObject["changeSymbol"] = row[10]
            rowObject["netRecorded"] = parseFloat((row[11]).replace(",", "."))
            rowObject["netNotRecorded"] = parseFloat(row[12].replace(",", "."))
            rowObject["exemptOperation"] = parseFloat(row[13].replace(",", "."))
            rowObject["otherTributes"] = parseFloat(row[14].replace(",", "."))
            rowObject["totalVat"] = parseFloat(row[15].replace(",", "."))
            rowObject["totalInvoice"] = parseFloat(row[16].replace(",", "."))
            return rowObject
        })
        return jsonData
    } catch (error) {
        return []
    }
}