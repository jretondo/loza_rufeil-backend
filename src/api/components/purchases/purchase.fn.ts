import roundNumber from "../../../utils/functions/roundNumber";
import path from 'path';
import fs from 'fs';
import {
    IHeaderReceiptReq,
    IPaymentReceiptReq,
    IProviders,
    IPurchaseEntries,
    IReceiptConcept,
    IReceipts,
    ITaxesReceiptReq,
    IVatRatesReceipts
} from "../../../interfaces/Tables";
import Receipt from "../../../models/Receipts";
import moment from "moment";
import { stringFill } from "../../../utils/functions/stringFill";
import XLSX from 'xlsx';
import { IDataSheetCVSPurchaseImport, IDataSheetCVSPurchaseImportComplete } from "../../../interfaces/Others";
import PurchasePeriod from "../../../models/PurchasePeriod";
import { monthToStr } from "../../../utils/functions/monthStr";
import Client from "../../../models/Client";
import AccountingPeriod from "../../../models/AccountingPeriod";
import { zfill } from "../../../utils/functions/fillZeros";
import JsReport from "jsreport-core";
import { promisify } from "util";
import ejs from 'ejs';
import { formatMoney } from "../../../utils/functions/formatMoney";

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
    const totalPayment = roundNumber(paymentReceipt.reduce((acc, payment) => acc + payment.amount, 0), 2)
    const totalTaxes = roundNumber(taxesReceipt.reduce((acc, tax) => acc + tax.amount, 0), 2)
    const totalConcepts = roundNumber(receiptConcepts.reduce((acc, concept) => acc + concept.amount, 0), 2)

    const vatTaxes = taxesReceipt.filter(tax => tax.is_vat)

    if (roundNumber(total, 2) !== roundNumber(totalPayment, 2) || roundNumber(total, 2) !== roundNumber(totalTaxes + totalConcepts, 2)) {
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

    const totalVatRecorded = roundNumber(taxesReceipt.reduce((acc, tax) => acc + tax.recorded, 0))

    if (vatTaxes.length > 0 && (roundNumber(totalRecordedConcepts, 2) !== roundNumber(totalVatRecorded, 2))) {
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
        const calculatedRecorded = () => {
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

        const recorded = roundNumber(calculatedRecorded(), 0)

        if (recorded !== roundNumber(tax.recorded, 0)) {
            throw new Error("No se validan los totales grabados!")
        }

        return {
            recorded_net: tax.recorded,
            vat_type_id: tax.type,
            vat_amount: tax.amount,
            receipt_id: 0
        }
    })

    const purchaseEntriesConcepts: IPurchaseEntries[] = receiptConcepts.map(concept => {
        return {
            date: headerReceipt.date,
            receipt_id: 0,
            account_chart_id: concept.account_chart_id || null,
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
            account_chart_id: payment.account_chart_id || null,
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
    const diference = "0.00"
    const total =
        stringFill((stringFill(purchaseItems.dataValues.total.toString().split(".")[0], 13) +
            stringFill(purchaseItems.dataValues.total.toString().split(".")[1], 2)), 15, "0", false)
    const unrecorded =
        stringFill((stringFill(diference.toString().split(".")[0], 13) +
            stringFill(diference.toString().split(".")[1], 2)), 15, "0", false)
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
    return vatRates.map((vatRate: any) => {
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
        console.log('error :>> ', error);
        return []
    }
}

export const jsonDataInvoiceGeneratorComplete = (dataSheet: Array<string[]>): IDataSheetCVSPurchaseImportComplete[] => {
    try {
        const data = dataSheet.slice(1)
        const jsonData = data.map((row: any) => {
            for (let i = 0; i < row.length; i++) {
                if (!row[i]) {
                    row[i] = '0,00'
                }
            }
            const rowObject: any = {}
            rowObject["date"] = moment(new Date(row[0]).setDate(new Date(row[0]).getDate() + 1)).format("YYYY-MM-DD")
            rowObject["invoiceType"] = row[1]
            rowObject["sellPoint"] = row[2]
            rowObject["invoiceNumber"] = row[3]
            rowObject["documentType"] = row[4]
            rowObject["documentNumber"] = row[5]
            rowObject["providerName"] = row[6]
            rowObject["totalInvoice"] = parseFloat(row[7].replace(",", "."))
            //row[8]
            //row[9]
            rowObject["unrecorded"] = parseFloat(row[10].replace(",", "."))
            rowObject["exemptOperation"] = parseFloat(row[11].replace(",", "."))
            //row[12]
            rowObject["nationalTaxes"] = parseFloat(row[13].replace(",", "."))
            rowObject["grossIncome"] = parseFloat(row[14].replace(",", "."))
            rowObject["localTaxes"] = parseFloat(row[15].replace(",", "."))
            rowObject["vatWithholdings"] = parseFloat(row[16].replace(",", "."))
            rowObject["internalTaxes"] = parseFloat(row[17].replace(",", "."))
            rowObject["otherTributes"] = parseFloat(row[18].replace(",", "."))
            rowObject["0_00VatBase"] = parseFloat(row[19].replace(",", "."))
            rowObject["2_50VatBase"] = parseFloat(row[20].replace(",", "."))
            rowObject["2_50Vat"] = parseFloat(row[21].replace(",", "."))
            rowObject["5_00VatBase"] = parseFloat(row[22].replace(",", "."))
            rowObject["5_00Vat"] = parseFloat(row[23].replace(",", "."))
            rowObject["10_50VatBase"] = parseFloat(row[24].replace(",", "."))
            rowObject["10_50Vat"] = parseFloat(row[25].replace(",", "."))
            rowObject["21_00VatBase"] = parseFloat(row[26].replace(",", "."))
            rowObject["21_00Vat"] = parseFloat(row[27].replace(",", "."))
            rowObject["27_00VatBase"] = parseFloat(row[28].replace(",", "."))
            rowObject["27_00Vat"] = parseFloat(row[29].replace(",", "."))
            rowObject["totalRecorded"] = parseFloat(row[30].replace(",", "."))
            rowObject["totalVat"] = parseFloat(row[31].replace(",", "."))

            return rowObject
        })
        return jsonData
    } catch (error) {
        console.log('error :>> ', error);
        return []
    }
}

export const receiptsExcelGenerator = (receipts: IReceipts[]) => {
    const receiptsTraslated = receipts.map(receipt => {
        const invoiceType = invoiceTypeConvert(receipt.invoice_type_id)
        return {
            Fecha: moment(receipt.date).format("DD/MM/YYYY"),
            Tipo: invoiceType,
            Punto_de_Venta: receipt.sell_point,
            Número: receipt.number,
            Proveedor: receipt.Provider?.business_name,
            Cuit_Proveedor: receipt.Provider?.document_number,
            Ingresos_Brutos: receipt.gross_income_withholdings,
            Operaciones_Exentas: roundNumber(receipt.exempt_transactions),
            Percepciones_de_IVA: roundNumber(receipt.vat_withholdings),
            Percepciones_de_impuestos_nacionales: roundNumber(receipt.national_tax_withholdings),
            Percepciones_de_ingresos_brutos: roundNumber(receipt.gross_income_withholdings),
            Percepciones_municipales: roundNumber(receipt.local_tax_withholdings),
            Impuestos_internos: roundNumber(receipt.internal_tax),
            Total_Iva_0: receipt.VatRatesReceipts ? receipt.VatRatesReceipts.find((vat: any) => vat.vat_type_id === 4)?.recorded_net || 0 : 0,
            Total_Iva_2_5: receipt.VatRatesReceipts ? receipt.VatRatesReceipts.find((vat: any) => vat.vat_type_id === 5)?.recorded_net || 0 : 0,
            Total_Iva_5: receipt.VatRatesReceipts ? receipt.VatRatesReceipts.find((vat: any) => vat.vat_type_id === 6)?.recorded_net || 0 : 0,
            Total_Iva_10_5: receipt.VatRatesReceipts ? receipt.VatRatesReceipts.find((vat: any) => vat.vat_type_id === 8)?.recorded_net || 0 : 0,
            Total_Iva_21: receipt.VatRatesReceipts ? receipt.VatRatesReceipts.find((vat: any) => vat.vat_type_id === 9)?.recorded_net || 0 : 0,
            Total_Iva_27: receipt.VatRatesReceipts ? receipt.VatRatesReceipts.find((vat: any) => vat.vat_type_id === 10)?.recorded_net || 0 : 0,
            Total: roundNumber(receipt.total),
            Observaciones: receipt.observation
        }
    })
    const workBook = XLSX.utils.book_new()
    const workSheet = XLSX.utils.json_to_sheet(receiptsTraslated)
    XLSX.utils.book_append_sheet(workBook, workSheet, "Compras")
    const uniqueSuffix = moment().format("YYYYMMDDHHmmss")
    const excelAddress = path.join(__dirname, "..", "..", "..", "..", "public", "reports", "excel", uniqueSuffix + "-Compras.xlsx")
    XLSX.writeFile(workBook, excelAddress)
    setTimeout(() => {
        fs.unlinkSync(excelAddress)
    }, 2500);
    return {
        excelAddress,
        fileName: uniqueSuffix + "-Compras.xlsx"
    }
}

export const resumeDataGenerator = async (receipts: IReceipts[]) => {
    let clientId = 0
    const period = await PurchasePeriod.findOne({
        where: {
            id: receipts[0].purchase_period_id
        },
        include: [AccountingPeriod]
    }).then(periodData => {
        clientId = periodData?.dataValues.AccountingPeriod?.client_id || 0
        const month = monthToStr(periodData?.dataValues.month as number)
        return `${month}/${periodData?.dataValues.year}`
    })

    const clientData = await Client.findOne({
        where: { id: clientId }
    }).then(client => {
        return `${client?.dataValues.business_name} (CUIT: ${client?.dataValues.document_number})`
    })
    const total = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.total), 0))
    const exempt_transactions = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.exempt_transactions), 0))
    const vat_withholdings = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.vat_withholdings), 0))
    const national_tax_withholdings = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.national_tax_withholdings), 0))
    const gross_income_withholdings = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.gross_income_withholdings), 0))
    const local_tax_withholdings = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.local_tax_withholdings), 0))
    const internal_tax = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.internal_tax), 0))
    const unrecorded = roundNumber(receipts.reduce((acc, receipt) => acc + Number(receipt.unrecorded), 0))

    const neto_0: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 3)?.recorded_net || 0));
    }, 0));

    const neto_21: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 5)?.recorded_net || 0));
    }, 0));

    const vat_21: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 5)?.vat_amount || 0));
    }, 0));

    const neto_27: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 6)?.recorded_net || 0));
    }, 0));

    const vat_27: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 6)?.vat_amount || 0));
    }, 0));

    const neto_10_5: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 4)?.recorded_net || 0));
    }, 0));

    const vat_10_5: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 4)?.vat_amount || 0));
    }, 0));


    const neto_5: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 8)?.recorded_net || 0));
    }, 0));

    const vat_5: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 8)?.vat_amount || 0));
    }, 0));


    const neto_2_5: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 9)?.recorded_net || 0));
    }, 0));

    const vat_2_5: number = roundNumber(receipts.reduce((acc, receipt) => {
        return acc + (Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 9)?.vat_amount || 0));
    }, 0));


    const totals = [
        { name: "Total", value: total },
        { name: "Operaciones Exentas", value: exempt_transactions },
        { name: "Percepciones de IVA", value: vat_withholdings },
        { name: "Percepciones de impuestos nacionales", value: national_tax_withholdings },
        { name: "Percepciones de ingresos brutos", value: gross_income_withholdings },
        { name: "Percepciones municipales", value: local_tax_withholdings },
        { name: "Impuestos internos", value: internal_tax },
        { name: "No grabado", value: unrecorded },
        { name: "Total IVA 21%", value: vat_21 },
        { name: "Total IVA 27%", value: vat_27 },
        { name: "Total IVA 10.5%", value: vat_10_5 },
        { name: "Total IVA 5%", value: vat_5 },
        { name: "Total IVA 2.5%", value: vat_2_5 }
    ]
    const totalsList = totals.filter(total => total.value !== 0).map(total => {
        return {
            name: total.name,
            value: formatMoney(total.value)
        }
    })
    const purchases = receipts.map(receipt => {
        return {
            date: moment(receipt.date).format("DD/MM/YYYY"),
            receipt: `${invoiceTypeConvert(receipt.invoice_type_id)} ${zfill(receipt.sell_point, 5)}-${zfill(receipt.number, 8)}`,
            business_name: receipt.Provider?.business_name,
            document_number: receipt.Provider?.document_number,
            unrecorded: formatMoney(receipt.unrecorded),
            total_net: formatMoney(receipt.VatRateReceipts ? receipt.VatRateReceipts.reduce((acc: any, vat: { recorded_net: any; }) => acc + Number(vat.recorded_net), 0) : 0),
            exempt_transactions: formatMoney(receipt.exempt_transactions),
            internal_tax: formatMoney(receipt.internal_tax),
            local_tax_withholdings: formatMoney(receipt.local_tax_withholdings),
            vat_21: formatMoney(Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 5)?.vat_amount || 0)),
            vat_27: formatMoney(Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 6)?.vat_amount || 0)),
            vat_105: formatMoney(Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 4)?.vat_amount || 0)),
            vat_5: formatMoney(Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 8)?.vat_amount || 0)),
            vat_25: formatMoney(Number(receipt.VatRateReceipts?.find((vat: any) => vat.vat_type_id === 9)?.vat_amount || 0)),
            vat_withholdings: formatMoney(receipt.vat_withholdings),
            gross_income_withholdings: formatMoney(receipt.gross_income_withholdings),
            total: formatMoney(receipt.total)
        }
    })

    return {
        period,
        clientData,
        totalsList,
        purchases,
        exempt_transactions: formatMoney(exempt_transactions),
        internal_tax: formatMoney(internal_tax),
        vat_21: formatMoney(vat_21),
        vat_27: formatMoney(vat_27),
        vat_105: formatMoney(vat_10_5),
        vat_5: formatMoney(vat_5),
        vat_25: formatMoney(vat_2_5),
    }
}

export const receiptsPdfGenerator = async (receiptData: any): Promise<{
    pdfAddress: string,
    fileName: string
}> => {
    const uniqueSuffix = moment().format("YYYYMMDDHHmmss")
    const pdfAddress = path.join("public", "reports", "excel", uniqueSuffix + "-Compras.pdf")
    return new Promise(async (resolve, reject) => {
        //const productos = await productController.pricesProd()

        function base64_encode(file: any) {
            // read binary data
            var bitmap: Buffer = fs.readFileSync(file);
            // convert binary data to base64 encoded string
            return Buffer.from(bitmap).toString('base64');
        }

        const logo = base64_encode(path.join("public", "images", "logo.png"))
        const estilo = fs.readFileSync(path.join("views", "reports", "purchasesList", "styles.css"), 'utf8')

        const datos = {
            ...receiptData,
            logo: 'data:image/png;base64,' + logo,
            style: "<style>" + estilo + "</style>",
        }

        const jsreport = JsReport({
            extensions: {
                "chrome-pdf": {
                    "launchOptions": {
                        "args": ["--no-sandbox"]
                    }
                }
            }
        })

        jsreport.use(require('jsreport-chrome-pdf')())

        const writeFileAsync = promisify(fs.writeFile)
        await ejs.renderFile(path.join("views", "reports", "purchasesList", "index.ejs"), datos, async (err, data) => {
            if (err) {
                console.log('err', err);
                throw new Error("Algo salio mal")
            }

            await jsreport.init()

            jsreport.render({
                template: {
                    content: data,
                    name: 'lista',
                    engine: 'none',
                    recipe: 'chrome-pdf',
                    chrome: {
                        "landscape": true,
                        "format": "legal",
                        "scale": 0.8,
                        displayHeaderFooter: false,
                        marginBottom: "3.35cm",

                        marginTop: "0.5cm",
                        headerTemplate: ""
                    },

                },
            })
                .then(async (out) => {
                    await writeFileAsync(pdfAddress, out.content)
                    await jsreport.close()
                    const dataFact = {
                        pdfAddress,
                        fileName: uniqueSuffix + "-Compras.xlsx"
                    }
                    resolve(dataFact)
                })
                .catch((e) => {
                    reject(e)
                });
        })
    })
}

function invoiceTypeConvert(invoiceType: number) {
    switch (invoiceType) {
        case 1:
            return "Factura A";
        case 2:
            return "Nota de debito A";
        case 3:
            return "Nota de credito A";
        case 4:
            return "Recibo A"
        case 6:
            return "Factura B";
        case 7:
            return "Nota de debito B";
        case 8:
            return "Nota de credito B";
        case 9:
            return "Recibo B";
        case 11:
            return "Factura C";
        case 12:
            return "Nota de debito C";
        case 13:
            return "Nota de credito C";
        case 15:
            return "Recibo C";
        case 51:
            return "Factura M";
        case 52:
            return "Nota de debito M";
        case 53:
            return "Nota de credito M";
        case 54:
            return "Recibo M";
        case 81:
            return "Tique factura A - Controlador Fiscal";
        case 82:
            return "Tique factura B - Controlador Fiscal";
        case 83:
            return "Tique";
        case 109:
            return "Tique C"
        case 110:
            return "Tique nota de credito"
        case 111:
            return "Tique fcatura C"
        case 112:
            return "Tique nota de crédito A"
        case 113:
            return "Tique nota de crédito B"
        case 114:
            return "Tique nota de crédito C"
        case 115:
            return "Tique nota de debito A"
        case 116:
            return "Tique nota de debito B"
        case 117:
            return "Tique nota de debito C"
        case 118:
            return "Tique factura M"
        case 119:
            return "Tique nota de credito M"
        case 120:
            return "Tique nota de debito M"
        default:
            return "";
    }
}