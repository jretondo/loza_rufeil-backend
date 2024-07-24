import roundNumber from '../../../utils/functions/roundNumber';
import path from 'path';
import fs from 'fs';
import {
  IAccountCharts,
  ICustomers,
  IHeaderReceiptReq,
  IInvoices,
  IReceiptConcept,
  ISellPointReq,
  ISellsEntries,
  ITaxesReceiptReq,
  IVatRatesInvoice,
} from '../../../interfaces/Tables';
import moment from 'moment';
import { stringFill } from '../../../utils/functions/stringFill';
import XLSX from 'xlsx';
import {
  IDataSheetCVSPurchaseImport,
  IDataSheetCVSPurchaseImportComplete,
} from '../../../interfaces/Others';
import { monthToStr } from '../../../utils/functions/monthStr';
import Client from '../../../models/Client';
import AccountingPeriod from '../../../models/AccountingPeriod';
import { zfill } from '../../../utils/functions/fillZeros';
import { formatMoney } from '../../../utils/functions/formatMoney';
import { invoiceTypeConvertObject } from '../../../utils/functions/getWordTypeInvoice';
import AccountChart from '../../../models/AccountCharts';
import { othersTypes, vatTaxes } from './sells.const';
import Invoice from '../../../models/Invoices';
import SellsParameter from '../../../models/SellsParameter';
import PointsSells from '../../../models/PointsSells';
import SellPeriod from '../../../models/SellPeriod';
import CustomerParameter from '../../../models/CustomerParameter';

export const checkDataReqReceipt = (
  headerReceipt: IHeaderReceiptReq,
  paymentReceipt: ISellPointReq[],
  taxesReceipt: ITaxesReceiptReq[],
  invoiceConcepts: IReceiptConcept[],
  customer: ICustomers,
  purchasePeriodId: number,
  observations: string,
  notBlock?: boolean,
) => {
  const { total } = headerReceipt;
  let checked = true;
  const totalPayment = roundNumber(
    paymentReceipt.reduce((acc, payment) => acc + Number(payment.amount), 0),
    2,
  );
  const totalTaxes = roundNumber(
    taxesReceipt.reduce((acc, tax) => acc + Number(tax.amount), 0),
    2,
  );
  const totalConcepts = roundNumber(
    invoiceConcepts.reduce((acc, concept) => acc + Number(concept.amount), 0),
    2,
  );

  const vatTaxes = taxesReceipt.filter((tax) => tax.is_vat);

  if (
    roundNumber(total, 2) !== roundNumber(totalPayment, 2) ||
    roundNumber(total, 2) !== roundNumber(totalTaxes + totalConcepts, 2)
  ) {
    checked = false;
    if (!notBlock) throw new Error('No se validan los totales!');
  }

  const totalUnrecordedConcepts = roundNumber(
    invoiceConcepts
      .filter((concept) => concept.recordType === 1)
      .reduce((acc, concept) => acc + concept.amount, 0),
  );

  const totalExemptTransactions = roundNumber(
    invoiceConcepts
      .filter((concept) => concept.recordType === 2)
      .reduce((acc, concept) => acc + concept.amount, 0),
  );

  const totalRecordedConcepts = roundNumber(
    invoiceConcepts
      .filter((concept) => concept.recordType === 0)
      .reduce((acc, concept) => acc + concept.amount, 0),
  );

  const totalVatWithholdings = roundNumber(
    taxesReceipt
      .filter((tax) => tax.type === 12)
      .reduce((acc, tax) => acc + tax.amount, 0),
  );

  const totalNationalTax = roundNumber(
    taxesReceipt
      .filter((tax) => tax.type === 13)
      .reduce((acc, tax) => acc + tax.amount, 0),
  );

  const totalGrossIncome = roundNumber(
    taxesReceipt
      .filter((tax) => tax.type === 14)
      .reduce((acc, tax) => acc + tax.amount, 0),
  );

  const totalLocalTax = roundNumber(
    taxesReceipt
      .filter((tax) => tax.type === 15)
      .reduce((acc, tax) => acc + tax.amount, 0),
  );

  const totalInternalTax = roundNumber(
    taxesReceipt
      .filter((tax) => tax.type === 16)
      .reduce((acc, tax) => acc + tax.amount, 0),
  );

  const totalVatRecorded = roundNumber(
    taxesReceipt.reduce((acc, tax) => acc + tax.recorded, 0),
  );

  if (
    vatTaxes.length > 0 &&
    roundNumber(totalRecordedConcepts, 2) !== roundNumber(totalVatRecorded, 2)
  ) {
    checked = false;
    if (!notBlock) throw new Error('No se validan los totales!');
  }

  const invoiceType = (): number => {
    switch (String(headerReceipt.type.id).concat(headerReceipt.word)) {
      case '1A':
        return 1;
      case '1B':
        return 6;
      case '1C':
        return 11;
      case '2A':
        return 4;
      case '2B':
        return 9;
      case '2C':
        return 15;
      case '3A':
        return 81;
      case '3B':
        return 82;
      case '3C':
        return 109;
      case '4A':
        return 3;
      case '4B':
        return 8;
      case '4C':
        return 13;
      case '5A':
        return 2;
      case '5B':
        return 7;
      case '5C':
        return 12;
      default:
        break;
    }
    return 0;
  };

  const NewReceipt: IInvoices = {
    date: headerReceipt.date,
    invoice_type_id: invoiceType(),
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
    customer_id: customer?.id || 0,
    sell_period_id: purchasePeriodId,
    observation: observations,
    word: headerReceipt.word,
    receipt_type: headerReceipt.type.id,
    checked,
  };

  const VatRatesReceipts: IVatRatesInvoice[] = vatTaxes.map((tax) => {
    const calculatedRecorded = () => {
      switch (tax.type) {
        case 4:
          return tax.amount / 0.105;
        case 5:
          return tax.amount / 0.21;
        case 6:
          return tax.amount / 0.27;
        case 8:
          return tax.amount / 0.05;
        case 9:
          return tax.amount / 0.025;
        default:
          break;
      }
      return tax.amount;
    };

    const recorded = roundNumber(calculatedRecorded(), 0);

    if (recorded !== roundNumber(tax.recorded, 0)) {
      checked = false;
      if (!notBlock) throw new Error('No se validan los totales!');
    }

    return {
      recorded_net: tax.recorded,
      vat_type_id: tax.type,
      vat_amount: tax.amount,
      invoice_id: 0,
    };
  });

  const purchaseEntriesConcepts: ISellsEntries[] = invoiceConcepts.map(
    (concept) => {
      return {
        date: headerReceipt.date,
        invoice_id: 0,
        account_chart_id: concept.account_chart_id || null,
        purchase_period_id: purchasePeriodId,
        description: concept.description,
        debit: 0,
        credit: concept.amount,
      };
    },
  );

  const purchaseEntriesTaxes: ISellsEntries[] = taxesReceipt.map((tax) => {
    return {
      date: headerReceipt.date,
      invoice_id: 0,
      account_chart_id: tax.AccountChart?.id || null,
      purchase_period_id: purchasePeriodId,
      description: tax.name,
      debit: 0,
      credit: tax.amount,
    };
  });

  const purchaseEntriesPayment: ISellsEntries[] = paymentReceipt.map(
    (payment) => {
      return {
        date: headerReceipt.date,
        invoice_id: 0,
        account_chart_id: payment.account_chart_id || null,
        purchase_period_id: purchasePeriodId,
        description: payment.number.toString(),
        debit: payment.amount,
        credit: 0,
      };
    },
  );

  const purchaseEntries: ISellsEntries[] = [
    ...purchaseEntriesConcepts,
    ...purchaseEntriesTaxes,
    ...purchaseEntriesPayment,
  ];

  return { NewReceipt, VatRatesReceipts, purchaseEntries };
};

export const createPurchaseTxtItems = (purchaseItems: Invoice[]) => {
  let text = '';
  purchaseItems.forEach((purchase, key) => {
    if (key === purchaseItems.length - 1) {
      text += createPurchaseTxtItem(purchase);
    } else {
      text += createPurchaseTxtItem(purchase) + '\n';
    }
  });
  return text;
};

export const createPurchaseTxtItem = (purchaseItems: Invoice) => {
  const date = stringFill(
    moment.utc(purchaseItems.dataValues.date).format('YYYYMMDD'),
    8,
  );
  const invoiceType = stringFill(
    purchaseItems.dataValues.invoice_type_id.toString(),
    3,
  );
  const sellPoint = stringFill(
    purchaseItems.dataValues.sell_point.toString(),
    5,
  );
  const number = stringFill(purchaseItems.dataValues.number.toString(), 20);
  const importClearance = stringFill(' ', 16, ' ');
  const providerDocType = stringFill(
    purchaseItems.dataValues.Customer?.document_type.toString() || '',
    2,
  );
  const providerNumber = stringFill(
    purchaseItems.dataValues.Customer?.document_number.toString() || '',
    20,
  );
  const providerName = stringFill(
    purchaseItems.dataValues.Customer?.business_name || ''.toString(),
    30,
    ' ',
    false,
  );
  const diference =
    purchaseItems.dataValues.word === 'A'
      ? purchaseItems.dataValues.unrecorded
      : '0.00';

  const total = stringFill(
    stringFill(purchaseItems.dataValues.total.toString().split('.')[0], 13) +
      stringFill(purchaseItems.dataValues.total.toString().split('.')[1], 2),
    15,
    '0',
    false,
  );

  const unrecorded = stringFill(
    stringFill(diference.toString().split('.')[0], 13) +
      stringFill(diference.toString().split('.')[1], 2),
    15,
    '0',
    false,
  );

  const exemptTransactions = stringFill(
    stringFill(
      purchaseItems.dataValues.exempt_transactions.toString().split('.')[0],
      13,
    ) +
      stringFill(
        purchaseItems.dataValues.exempt_transactions.toString().split('.')[1],
        2,
      ),
    15,
    '0',
    false,
  );
  const vatWithholdings = stringFill(
    stringFill(
      purchaseItems.dataValues.vat_withholdings.toString().split('.')[0],
      13,
    ) +
      stringFill(
        purchaseItems.dataValues.vat_withholdings.toString().split('.')[1],
        2,
      ),
    15,
    '0',
    false,
  );
  const nationalTaxWithholdings = stringFill(
    stringFill(
      purchaseItems.dataValues.national_tax_withholdings
        .toString()
        .split('.')[0],
      13,
    ) +
      stringFill(
        purchaseItems.dataValues.national_tax_withholdings
          .toString()
          .split('.')[1],
        2,
      ),
    15,
    '0',
    false,
  );
  const grossIncomeWithholdings = stringFill(
    stringFill(
      purchaseItems.dataValues.gross_income_withholdings
        .toString()
        .split('.')[0],
      13,
    ) +
      stringFill(
        purchaseItems.dataValues.gross_income_withholdings
          .toString()
          .split('.')[1],
        2,
      ),
    15,
    '0',
    false,
  );
  const localTaxWithholdings = stringFill(
    stringFill(
      purchaseItems.dataValues.local_tax_withholdings.toString().split('.')[0],
      13,
    ) +
      stringFill(
        purchaseItems.dataValues.local_tax_withholdings
          .toString()
          .split('.')[1],
        2,
      ),
    15,
    '0',
    false,
  );
  const internalTax = stringFill(
    stringFill(
      purchaseItems.dataValues.internal_tax.toString().split('.')[0],
      13,
    ) +
      stringFill(
        purchaseItems.dataValues.internal_tax.toString().split('.')[1],
        2,
      ),
    15,
    '0',
    false,
  );

  const moneyCode = stringFill('PES', 3);
  const exchangeRate = stringFill('1000000', 10);
  console.log(
    'purchaseItems.dataValues.vat_rates_quantity :>> ',
    purchaseItems.dataValues.vat_rates_quantity,
  );
  const vatRatesQuantity = stringFill(
    purchaseItems.dataValues.vat_rates_quantity.toString(),
    1,
  );
  const operationCode = stringFill(' ', 1);
  const totalVat =
    purchaseItems.dataValues.VatRatesInvoice?.reduce(
      (acc: any, vat: any) => acc + vat.vat_amount,
      0,
    ) || 0;
  const fiscalCredit = stringFill(
    stringFill(totalVat.toString().split('.')[0], 13) +
      stringFill(
        totalVat.toString().split('.').length > 1
          ? totalVat.toString().split('.')[1]
          : '0',
        2,
      ),
    15,
    '0',
    false,
  );
  const otherTributes = stringFill('0', 15);
  const brokerDocument = stringFill('0', 11);
  const brokerName = stringFill(' ', 30, ' ');
  const commissionVat = stringFill('0', 15);
  const row = `${date}${invoiceType}${sellPoint}${number}${importClearance}${providerDocType}${providerNumber}${providerName}${total}${unrecorded}${exemptTransactions}${vatWithholdings}${nationalTaxWithholdings}${grossIncomeWithholdings}${localTaxWithholdings}${internalTax}${moneyCode}${exchangeRate}${vatRatesQuantity}${operationCode}${fiscalCredit}${otherTributes}${brokerDocument}${brokerName}${commissionVat}`;
  return row;
};

export const createPurchaseTxtVatRates = (purchaseItems: Invoice[]) => {
  let text = '';
  purchaseItems.forEach((purchase, key) => {
    if (key === purchaseItems.length - 1) {
      text += createPurchaseTxtVatRateItem(purchase);
    } else {
      text += createPurchaseTxtVatRateItem(purchase) + '\n';
    }
  });
  return text;
};

export const createPurchaseTxtVatRateItem = (purchaseItems: Invoice) => {
  const vatRates = purchaseItems.dataValues.VatRatesInvoice;
  if (!vatRates) {
    return [];
  }
  return vatRates.map((vatRate: any) => {
    const invoiceType = stringFill(
      purchaseItems.dataValues.invoice_type_id.toString(),
      3,
    );
    const sellPoint = stringFill(
      purchaseItems.dataValues.sell_point.toString(),
      5,
    );
    const number = stringFill(purchaseItems.dataValues.number.toString(), 20);
    const providerDocType = stringFill(
      purchaseItems.dataValues.Customer?.document_type.toString() || '',
      2,
    );
    const providerNumber = stringFill(
      purchaseItems.dataValues.Customer?.document_number.toString() || '',
      20,
    );
    const recordedNet = stringFill(
      stringFill(vatRate.recorded_net.toString().split('.')[0], 13) +
        stringFill(vatRate.recorded_net.toString().split('.')[1], 2),
      15,
      '0',
      false,
    );
    const vatType = stringFill(vatRate.vat_type_id.toString(), 4);
    const vatAmount = stringFill(
      stringFill(vatRate.vat_amount.toString().split('.')[0], 13) +
        stringFill(vatRate.vat_amount.toString().split('.')[1], 2),
      15,
      '0',
      false,
    );
    const row = `${invoiceType}${sellPoint}${number}${providerDocType}${providerNumber}${recordedNet}${vatType}${vatAmount}`;
    return row;
  });
};

export const getDataSheet = (fileUrl: string): any => {
  const workBook = XLSX.readFile(fileUrl);
  const sheets = workBook.SheetNames;
  const sheet_1 = sheets[0];
  return XLSX.utils.sheet_to_json(workBook.Sheets[sheet_1], {
    header: 1,
    raw: false,
    dateNF: 'DD/MM/YYYY',
    rawNumbers: false,
  });
};

export const jsonDataInvoiceGenerator = (
  dataSheet: Array<string[]>,
): IDataSheetCVSPurchaseImport[] => {
  try {
    const data = dataSheet.slice(1);
    const jsonData = data.map((row: any) => {
      const rowObject: any = {};
      rowObject['date'] = moment
        .utc(new Date(row[0]).setDate(new Date(row[0]).getDate() + 1))
        .format('YYYY-MM-DD');
      rowObject['invoiceType'] = row[1];
      rowObject['sellPoint'] = row[2];
      rowObject['invoiceNumber'] = row[3];
      rowObject['cae'] = row[5];
      rowObject['providerDocumentType'] = row[6];
      rowObject['providerDocumentNumber'] = row[7];
      rowObject['providerName'] = row[8];
      rowObject['changeType'] = row[9];
      rowObject['changeSymbol'] = row[10];
      rowObject['netRecorded'] = parseFloat(row[11].replace(',', '.'));
      rowObject['netNotRecorded'] = parseFloat(row[12].replace(',', '.'));
      rowObject['exemptOperation'] = parseFloat(row[13].replace(',', '.'));
      rowObject['otherTributes'] = parseFloat(row[14].replace(',', '.'));
      rowObject['totalVat'] = parseFloat(row[15].replace(',', '.'));
      rowObject['totalInvoice'] = parseFloat(row[16].replace(',', '.'));
      return rowObject;
    });
    return jsonData;
  } catch (error) {
    console.log('error :>> ', error);
    return [];
  }
};

export const jsonDataInvoiceGeneratorComplete = (
  dataSheet: Array<string[]>,
): IDataSheetCVSPurchaseImportComplete[] => {
  try {
    const data = dataSheet.slice(1);
    const jsonData = data.map((row: any) => {
      for (let i = 0; i < row.length; i++) {
        if (!row[i]) {
          row[i] = '0,00';
        }
      }
      const rowObject: any = {};
      rowObject['date'] = moment
        .utc(new Date(row[0]).setDate(new Date(row[0]).getDate() + 1))
        .format('YYYY-MM-DD');
      rowObject['invoiceType'] = parseInt(row[1]);
      rowObject['sellPoint'] = row[2];
      rowObject['invoiceNumber'] = row[3];
      rowObject['documentType'] = row[5];
      rowObject['documentNumber'] = row[6];
      rowObject['clientName'] = row[7];
      rowObject['totalInvoice'] = parseFloat(row[9].replace(',', '.'));
      //row[8]
      //row[9]
      rowObject['unrecorded'] = parseFloat(row[12].replace(',', '.'));
      rowObject['exemptOperation'] = parseFloat(row[13].replace(',', '.'));
      //row[12]
      rowObject['nationalTaxes'] = parseFloat(row[14].replace(',', '.'));
      rowObject['grossIncome'] = parseFloat(row[15].replace(',', '.'));
      rowObject['localTaxes'] = parseFloat(row[16].replace(',', '.'));
      rowObject['vatWithholdings'] = parseFloat(row[17].replace(',', '.'));
      rowObject['internalTaxes'] = parseFloat(row[18].replace(',', '.'));
      rowObject['otherTributes'] = parseFloat(row[19].replace(',', '.'));
      rowObject['0_00VatBase'] = parseFloat(row[20].replace(',', '.'));
      rowObject['2_50VatBase'] = parseFloat(row[21].replace(',', '.'));
      rowObject['2_50Vat'] = parseFloat(row[22].replace(',', '.'));
      rowObject['5_00VatBase'] = parseFloat(row[23].replace(',', '.'));
      rowObject['5_00Vat'] = parseFloat(row[24].replace(',', '.'));
      rowObject['10_50VatBase'] = parseFloat(row[25].replace(',', '.'));
      rowObject['10_50Vat'] = parseFloat(row[26].replace(',', '.'));
      rowObject['21_00VatBase'] = parseFloat(row[27].replace(',', '.'));
      rowObject['21_00Vat'] = parseFloat(row[28].replace(',', '.'));
      rowObject['27_00VatBase'] = parseFloat(row[29].replace(',', '.'));
      rowObject['27_00Vat'] = parseFloat(row[30].replace(',', '.'));
      rowObject['totalRecorded'] = parseFloat(row[31].replace(',', '.'));
      rowObject['totalVat'] = parseFloat(row[32].replace(',', '.'));

      return rowObject;
    });
    return jsonData;
  } catch (error) {
    console.log('error :>> ', error);
    return [];
  }
};

export const generateUncheckedReceiptsCVS = (
  invoices: {
    checked: boolean;
    date: Date;
    invoice_type_id: number;
    sell_point: number;
    number: number;
    total: number;
    unrecorded: number;
    exempt_transactions: number;
    vat_withholdings: number;
    national_tax_withholdings: number;
    gross_income_withholdings: number;
    local_tax_withholdings: number;
    internal_tax: number;
    vat_rates_quantity: number;
    customer_id: number;
    sell_period_id: number;
    observation: string;
    word: string;
    invoice_type: number;
    Customer: ICustomers | undefined;
    CustomerRaw: ICustomers | undefined;
    customer_name: string;
    customer_document: Number;
    VatRatesInvoices: IVatRatesInvoice[];
  }[],
) => {
  const workBook = XLSX.utils.book_new();
  const data: {
    fecha: string;
    tipo: number;
    punto_de_venta: number;
    numero: number;
    tipo_documento: number;
    numero_documento: string;
    denominacion: string;
    imp_total: number;
    moneda: 'PES';
    tipo_cambio: 1;
    imp_no_grabado: number;
    imp_exento: number;
    cred_fiscal: number;
    imp_pago_ctas: number;
    imp_percepciones_iibb: number;
    imp_percepciones_municipales: number;
    imp_cta_iva: number;
    imp_internos: number;
    imp_otros_tributos: number;
    neto_iva_0: number;
    neto_iva_2_5: number;
    iva_2_5: number;
    neto_iva_5: number;
    iva_5: number;
    neto_iva_10_5: number;
    iva_10_5: number;
    neto_iva_21: number;
    iva_21: number;
    neto_iva_27: number;
    iva_27: number;
    neto_gravado: number;
    iva_total: number;
  }[] = invoices.map((invoice) => {
    const invoiceType = Number(invoice.invoice_type_id);
    const totalVat: number = Number(
      (invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.reduce(
            (acc, vat) =>
              acc +
              Number(
                vat.vat_amount
                  ? vat.vat_type_id < 10
                    ? vat.vat_amount
                    : 0
                  : 0,
              ),
            0,
          )
        : 0
      ).toFixed(2),
    );
    const totalNet: number = Number(
      (invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.reduce(
            (acc, vat) =>
              acc +
              Number(
                vat.recorded_net
                  ? vat.vat_type_id < 10
                    ? vat.recorded_net
                    : 0
                  : 0,
              ),
            0,
          )
        : 0
      ).toFixed(2),
    );

    return {
      fecha: moment.utc(invoice.date).format('YYYY-MM-DD'),
      tipo: invoiceType,
      punto_de_venta: invoice.sell_point,
      numero: invoice.number,
      tipo_documento: invoice.Customer?.document_type || 80,
      numero_documento: invoice.Customer?.document_number || '',
      denominacion: invoice.Customer?.business_name || '',
      imp_total: invoice.total,
      moneda: 'PES',
      tipo_cambio: 1,
      imp_no_grabado: Number(invoice.unrecorded.toFixed(2)) - totalVat,
      imp_exento: invoice.exempt_transactions,
      cred_fiscal: totalVat,
      imp_pago_ctas: invoice.national_tax_withholdings,
      imp_percepciones_iibb: invoice.gross_income_withholdings,
      imp_percepciones_municipales: invoice.local_tax_withholdings,
      imp_cta_iva: invoice.vat_withholdings,
      imp_internos: invoice.internal_tax,
      imp_otros_tributos: 0,
      neto_iva_0: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 3)
            ?.recorded_net || 0
        : 0,
      neto_iva_2_5: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 9)
            ?.recorded_net || 0
        : 0,
      iva_2_5: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 9)
            ?.vat_amount || 0
        : 0,
      neto_iva_5: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 8)
            ?.recorded_net || 0
        : 0,
      iva_5: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 8)
            ?.vat_amount || 0
        : 0,
      neto_iva_10_5: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 4)
            ?.recorded_net || 0
        : 0,
      iva_10_5: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 4)
            ?.vat_amount || 0
        : 0,
      neto_iva_21: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 5)
            ?.recorded_net || 0
        : 0,
      iva_21: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 5)
            ?.vat_amount || 0
        : 0,
      neto_iva_27: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 6)
            ?.recorded_net || 0
        : 0,
      iva_27: invoice.VatRatesInvoices
        ? invoice.VatRatesInvoices.find((vat: any) => vat.vat_type_id === 6)
            ?.vat_amount || 0
        : 0,
      neto_gravado: totalNet,
      iva_total: totalVat,
    };
  });

  const workSheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workBook, workSheet, 'Compras');
  const uniqueSuffix = moment().format('YYYYMMDDHHmmss');
  const excelAddress = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'public',
    'reports',
    'excel',
    uniqueSuffix + '-Compras.xlsx',
  );
  XLSX.writeFile(workBook, excelAddress);
  setTimeout(() => {
    fs.unlinkSync(excelAddress);
  }, 2500);
  return {
    excelAddress,
    fileName: uniqueSuffix + '-Compras.xlsx',
  };
};

export const invoicesExcelGenerator = (invoices: IInvoices[]) => {
  const invoicesTraslated = invoices.map((invoice) => {
    const invoiceType = invoiceTypeConvert(invoice.invoice_type_id);
    return {
      Fecha: moment.utc(invoice.date).format('DD/MM/YYYY'),
      Tipo: invoiceType,
      Punto_de_Venta: invoice.sell_point,
      Número: invoice.number,
      Cliente: invoice.Customer?.business_name,
      Cuit_Proveedor: invoice.Customer?.document_number,
      Ingresos_Brutos: invoice.gross_income_withholdings,
      Operaciones_Exentas: roundNumber(invoice.exempt_transactions),
      Percepciones_de_IVA: roundNumber(invoice.vat_withholdings),
      Percepciones_de_impuestos_nacionales: roundNumber(
        invoice.national_tax_withholdings,
      ),
      Percepciones_de_ingresos_brutos: roundNumber(
        invoice.gross_income_withholdings,
      ),
      Percepciones_municipales: roundNumber(invoice.local_tax_withholdings),
      Impuestos_internos: roundNumber(invoice.internal_tax),
      Total_Iva_0: invoice.VatRatesInvoice
        ? invoice.VatRatesInvoice.find((vat: any) => vat.vat_type_id === 4)
            ?.recorded_net || 0
        : 0,
      Total_Iva_2_5: invoice.VatRatesInvoice
        ? invoice.VatRatesInvoice.find((vat: any) => vat.vat_type_id === 5)
            ?.recorded_net || 0
        : 0,
      Total_Iva_5: invoice.VatRatesInvoice
        ? invoice.VatRatesInvoice.find((vat: any) => vat.vat_type_id === 6)
            ?.recorded_net || 0
        : 0,
      Total_Iva_10_5: invoice.VatRatesInvoice
        ? invoice.VatRatesInvoice.find((vat: any) => vat.vat_type_id === 8)
            ?.recorded_net || 0
        : 0,
      Total_Iva_21: invoice.VatRatesInvoice
        ? invoice.VatRatesInvoice.find((vat: any) => vat.vat_type_id === 9)
            ?.recorded_net || 0
        : 0,
      Total_Iva_27: invoice.VatRatesInvoice
        ? invoice.VatRatesInvoice.find((vat: any) => vat.vat_type_id === 10)
            ?.recorded_net || 0
        : 0,
      Total: roundNumber(invoice.total),
      Observaciones: invoice.observation,
    };
  });
  const workBook = XLSX.utils.book_new();
  const workSheet = XLSX.utils.json_to_sheet(invoicesTraslated);
  XLSX.utils.book_append_sheet(workBook, workSheet, 'Compras');
  const uniqueSuffix = moment().format('YYYYMMDDHHmmss');
  const excelAddress = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'public',
    'reports',
    'excel',
    uniqueSuffix + '-Compras.xlsx',
  );
  XLSX.writeFile(workBook, excelAddress);
  setTimeout(() => {
    fs.unlinkSync(excelAddress);
  }, 2500);
  return {
    excelAddress,
    fileName: uniqueSuffix + '-Compras.xlsx',
  };
};

export const resumeDataGenerator = async (invoices: IInvoices[]) => {
  let clientId = 0;
  const period = await SellPeriod.findOne({
    where: {
      id: invoices[0].sell_period_id,
    },
    include: [AccountingPeriod],
  }).then((periodData) => {
    clientId = periodData?.dataValues.AccountingPeriod?.client_id || 0;
    const month = monthToStr(periodData?.dataValues.month as number);
    return `${month}/${periodData?.dataValues.year}`;
  });

  const clientData = await Client.findOne({
    where: { id: clientId },
  }).then((client) => {
    return `${client?.dataValues.business_name} (CUIT: ${client?.dataValues.document_number})`;
  });
  const total = roundNumber(
    invoices.reduce((acc, invoices) => acc + Number(invoices.total), 0),
  );
  const exempt_transactions = roundNumber(
    invoices.reduce(
      (acc, invoices) => acc + Number(invoices.exempt_transactions),
      0,
    ),
  );
  const vat_withholdings = roundNumber(
    invoices.reduce(
      (acc, invoices) => acc + Number(invoices.vat_withholdings),
      0,
    ),
  );
  const national_tax_withholdings = roundNumber(
    invoices.reduce(
      (acc, invoices) => acc + Number(invoices.national_tax_withholdings),
      0,
    ),
  );
  const gross_income_withholdings = roundNumber(
    invoices.reduce(
      (acc, invoices) => acc + Number(invoices.gross_income_withholdings),
      0,
    ),
  );
  const local_tax_withholdings = roundNumber(
    invoices.reduce(
      (acc, invoices) => acc + Number(invoices.local_tax_withholdings),
      0,
    ),
  );
  const internal_tax = roundNumber(
    invoices.reduce((acc, invoice) => acc + Number(invoice.internal_tax), 0),
  );
  const unrecorded = roundNumber(
    invoices.reduce((acc, invoice) => acc + Number(invoice.unrecorded), 0),
  );

  const neto_0: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 3)
            ?.recorded_net || 0,
        )
      );
    }, 0),
  );

  const neto_21: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 5)
            ?.recorded_net || 0,
        )
      );
    }, 0),
  );

  const vat_21: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 5)
            ?.vat_amount || 0,
        )
      );
    }, 0),
  );

  const neto_27: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 6)
            ?.recorded_net || 0,
        )
      );
    }, 0),
  );

  const vat_27: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 6)
            ?.vat_amount || 0,
        )
      );
    }, 0),
  );

  const neto_10_5: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 4)
            ?.recorded_net || 0,
        )
      );
    }, 0),
  );

  const vat_10_5: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 4)
            ?.vat_amount || 0,
        )
      );
    }, 0),
  );

  const neto_5: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 8)
            ?.recorded_net || 0,
        )
      );
    }, 0),
  );

  const vat_5: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 8)
            ?.vat_amount || 0,
        )
      );
    }, 0),
  );

  const neto_2_5: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 9)
            ?.recorded_net || 0,
        )
      );
    }, 0),
  );

  const vat_2_5: number = roundNumber(
    invoices.reduce((acc, invoice) => {
      return (
        acc +
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 9)
            ?.vat_amount || 0,
        )
      );
    }, 0),
  );

  const totals = [
    { name: 'Total', value: total },
    { name: 'Operaciones Exentas', value: exempt_transactions },
    { name: 'Percepciones de IVA', value: vat_withholdings },
    {
      name: 'Percepciones de impuestos nacionales',
      value: national_tax_withholdings,
    },
    {
      name: 'Percepciones de ingresos brutos',
      value: gross_income_withholdings,
    },
    { name: 'Percepciones municipales', value: local_tax_withholdings },
    { name: 'Impuestos internos', value: internal_tax },
    { name: 'No grabado', value: unrecorded },
    { name: 'Total IVA 21%', value: vat_21 },
    { name: 'Total IVA 27%', value: vat_27 },
    { name: 'Total IVA 10.5%', value: vat_10_5 },
    { name: 'Total IVA 5%', value: vat_5 },
    { name: 'Total IVA 2.5%', value: vat_2_5 },
  ];
  const totalsList = totals
    .filter((total) => total.value !== 0)
    .map((total) => {
      return {
        name: total.name,
        value: formatMoney(total.value),
      };
    });
  const purchases = invoices.map((invoice) => {
    return {
      date: moment.utc(invoice.date).format('DD/MM/YYYY'),
      invoice: `${invoiceTypeConvert(invoice.invoice_type_id)} ${zfill(
        invoice.sell_point,
        5,
      )}-${zfill(invoice.number, 8)}`,
      business_name: invoice.Customer?.business_name,
      document_number: invoice.Customer?.document_number,
      unrecorded: formatMoney(invoice.unrecorded),
      total_net: formatMoney(
        invoice.VatRatesInvoice
          ? invoice.VatRatesInvoice.reduce(
              (acc: any, vat: { recorded_net: any }) =>
                acc + Number(vat.recorded_net),
              0,
            )
          : 0,
      ),
      exempt_transactions: formatMoney(invoice.exempt_transactions),
      internal_tax: formatMoney(invoice.internal_tax),
      local_tax_withholdings: formatMoney(invoice.local_tax_withholdings),
      vat_21: formatMoney(
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 5)
            ?.vat_amount || 0,
        ),
      ),
      vat_27: formatMoney(
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 6)
            ?.vat_amount || 0,
        ),
      ),
      vat_105: formatMoney(
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 4)
            ?.vat_amount || 0,
        ),
      ),
      vat_5: formatMoney(
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 8)
            ?.vat_amount || 0,
        ),
      ),
      vat_25: formatMoney(
        Number(
          invoice.VatRatesInvoice?.find((vat: any) => vat.vat_type_id === 9)
            ?.vat_amount || 0,
        ),
      ),
      vat_withholdings: formatMoney(invoice.vat_withholdings),
      gross_income_withholdings: formatMoney(invoice.gross_income_withholdings),
      national_tax_withholdings: formatMoney(invoice.national_tax_withholdings),
      total: formatMoney(invoice.total),
    };
  });

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
    vat_withholdings: formatMoney(vat_withholdings),
    gross_income_withholdings: formatMoney(gross_income_withholdings),
    national_tax_withholdings: formatMoney(national_tax_withholdings),
  };
};

export const checkDuplicateReceipt = async (invoice: IInvoices) => {
  return await Invoice.findOne({
    where: {
      invoice_type_id: invoice.invoice_type_id,
      sell_point: invoice.sell_point,
      number: invoice.number,
      total: invoice.total,
      customer_id: invoice.customer_id,
    },
  });
};

export const checkDuplicateReceipts = async (invoices: IInvoices[]) => {
  const duplicates = [];
  for (const invoice of invoices) {
    const duplicate = await checkDuplicateReceipt(invoice);
    if (duplicate) {
      duplicates.push(duplicate);
    }
  }
  return duplicates;
};

function invoiceTypeConvert(invoiceType: number) {
  switch (invoiceType) {
    case 1:
      return 'Factura A';
    case 2:
      return 'Nota de debito A';
    case 3:
      return 'Nota de credito A';
    case 4:
      return 'Recibo A';
    case 6:
      return 'Factura B';
    case 7:
      return 'Nota de debito B';
    case 8:
      return 'Nota de credito B';
    case 9:
      return 'Recibo B';
    case 11:
      return 'Factura C';
    case 12:
      return 'Nota de debito C';
    case 13:
      return 'Nota de credito C';
    case 15:
      return 'Recibo C';
    case 51:
      return 'Factura M';
    case 52:
      return 'Nota de debito M';
    case 53:
      return 'Nota de credito M';
    case 54:
      return 'Recibo M';
    case 81:
      return 'Tique factura A - Controlador Fiscal';
    case 82:
      return 'Tique factura B - Controlador Fiscal';
    case 83:
      return 'Tique';
    case 109:
      return 'Tique C';
    case 110:
      return 'Tique nota de credito';
    case 111:
      return 'Tique fcatura C';
    case 112:
      return 'Tique nota de crédito A';
    case 113:
      return 'Tique nota de crédito B';
    case 114:
      return 'Tique nota de crédito C';
    case 115:
      return 'Tique nota de debito A';
    case 116:
      return 'Tique nota de debito B';
    case 117:
      return 'Tique nota de debito C';
    case 118:
      return 'Tique factura M';
    case 119:
      return 'Tique nota de credito M';
    case 120:
      return 'Tique nota de debito M';
    default:
      return '';
  }
}

export const completeReceipt = async (
  periodId: number,
  invoices: IInvoices[],
) => {
  return await Promise.all(
    invoices.map(async (invoice) => {
      const { word, type } = invoiceTypeConvertObject(invoice.invoice_type_id);

      const header = {
        date: invoice.date,
        total: invoice.total,
        type: type,
        word: word,
        sellPoint: invoice.sell_point,
        number: invoice.number,
      };

      const taxesList = await getClientParamFn(
        periodId,
        invoice.customer_id,
      ).then((data) => [...data.vat, ...data.others]);

      const { taxes, recorded } = getVatAmount(
        invoice.total,
        taxesList.map((data, key) => {
          return {
            type: data.type,
            recorded: 0,
            name: data.name,
            is_vat: data.is_vat,
            is_tax: data.is_tax,
            id: key,
            amount: 0,
            active: data.active,
            account_chart_id: data.AccountChart?.id || null,
            AccountChart: data.AccountChart as IAccountCharts,
          };
        }),
      );

      const invoiceConcepts: IReceiptConcept[] = invoice.Customer
        ? await CustomerParameter.findAll({
            where: [
              { customer_id: invoice.Customer?.id },
              { accounting_period_id: periodId },
            ],
            include: [AccountChart],
          }).then((data) => {
            let recordedAssigned = false;
            return data
              .map((concept) => {
                if (!recordedAssigned) {
                  concept.dataValues.amount = recorded;
                  recordedAssigned = true;
                } else {
                  concept.dataValues.amount = 0;
                }
                return {
                  account_chart_id: concept.dataValues.account_chart_id ?? 0,
                  accounting_period_id:
                    concept.dataValues.accounting_period_id ?? 0,
                  amount: concept.dataValues.amount,
                  description: concept.dataValues.description,
                  AccountChart: concept.dataValues.AccountChart,
                  recordType: 0,
                };
              })
              .filter((concept) => concept.amount && concept.amount > 0);
          })
        : [];

      const paymentsParameters: ISellPointReq[] = await paymentParameter(
        periodId,
      ).then((data) => {
        return data
          .map((sell, key) => {
            if (key === 0) {
              sell.dataValues.amount = invoice.total;
            } else {
              sell.dataValues.amount = 0;
            }
            return {
              account_chart_id: sell.dataValues.account_chart_id,
              accounting_period_id: sell.dataValues.accounting_period_id,
              amount: sell.dataValues.amount,
              number: Number(sell.dataValues.number),
            };
          })
          .filter((sell) => sell.amount && sell.amount > 0);
      });

      const data: invoiceFront = {
        header: header,
        sellPoints: paymentsParameters,
        concepts: invoiceConcepts,
        taxes: taxes,
        purchasePeriodId: periodId,
        customer: invoice.Customer as ICustomers,
        observations: invoice.observation,
        checked: false,
        total: invoice.total,
      };
      const checked = checkDataReqReceipt(
        data.header,
        data.sellPoints,
        data.taxes,
        data.concepts,
        data.customer,
        data.purchasePeriodId,
        data.observations,
        true,
      );
      return {
        ...invoice,
        header: header,
        payments: paymentsParameters,
        concepts: invoiceConcepts,
        taxes: taxes,
        purchasePeriodId: periodId,
        customer: invoice.Customer as ICustomers,
        observations: invoice.observation,
        total: invoice.total,
        checked: checked.NewReceipt.checked,
      };
    }),
  );
};

const getVatAmount = (totalAmount: number, taxesList: ITaxesReceiptReq[]) => {
  const newTaxesArray = taxesList.map((tax) => {
    if (roundNumber(totalAmount) > 0 && tax.active) {
      switch (tax.type) {
        case 4:
          if (tax.recorded) {
            tax.recorded = tax.recorded > 0 ? tax.recorded : 0;
            tax.amount = tax.recorded * 0.105;
          } else {
            tax.amount = totalAmount - totalAmount / 1.105;
            tax.recorded = tax.amount / 0.105;
          }
          break;
        case 5:
          if (tax.recorded) {
            tax.recorded = tax.recorded > 0 ? tax.recorded : 0;
            tax.amount = tax.recorded * 0.21;
          } else {
            tax.amount = totalAmount - totalAmount / 1.21;
            tax.recorded = tax.amount / 0.21;
          }
          break;
        case 6:
          if (tax.recorded) {
            tax.recorded = tax.recorded > 0 ? tax.recorded : 0;
            tax.amount = tax.recorded * 0.27;
          } else {
            tax.amount = totalAmount - totalAmount / 1.27;
            tax.recorded = tax.amount / 0.27;
          }
          break;
        case 8:
          if (tax.recorded) {
            tax.recorded = tax.recorded > 0 ? tax.recorded : 0;
            tax.amount = tax.recorded * 0.05;
          } else {
            tax.amount = totalAmount - totalAmount / 1.05;
            tax.recorded = tax.amount / 0.05;
          }
          break;
        case 9:
          if (tax.recorded) {
            tax.recorded = tax.recorded > 0 ? tax.recorded : 0;
            tax.amount = tax.recorded * 0.025;
          } else {
            tax.amount = totalAmount - totalAmount / 1.025;
            tax.recorded = tax.amount / 0.025;
          }
          break;
        default:
          break;
      }
    } else {
      tax.amount = 0;
      tax.recorded = 0;
    }
    tax.amount = roundNumber(tax.amount);
    tax.recorded = roundNumber(tax.recorded);
    return tax;
  });
  return {
    taxes: newTaxesArray.filter((tax) => tax.amount > 0),
    recorded: roundNumber(
      taxesList.reduce((acc, tax) => acc + roundNumber(tax.recorded), 0),
    ),
  };
};

export const getClientParamFn = async (
  periodId: number,
  vat_condition?: number,
) => {
  const clientVatParameters = await SellsParameter.findAll({
    where: [{ is_vat: true }, { accounting_period_id: periodId }],
    include: [AccountChart],
  });
  const clientOthersParameters = await SellsParameter.findAll({
    where: [{ is_vat: false }, { accounting_period_id: periodId }],
    include: [AccountChart],
  });

  const allClientVatParams = vatTaxes.map((vatTax) => {
    const find = clientVatParameters.find(
      (clientVatParam) => clientVatParam.dataValues.type === vatTax.id,
    );
    if (find && vat_condition !== 20) {
      return {
        type: vatTax.id,
        name: vatTax.name,
        active: find.dataValues.active,
        AccountChart: find.dataValues.AccountChart,
        is_tax: true,
        is_vat: true,
      };
    } else {
      return {
        type: vatTax.id,
        name: vatTax.name,
        active: false,
        AccountChart: null,
        is_tax: true,
        is_vat: true,
      };
    }
  });

  const allClientOthersParams = othersTypes.map((otherType) => {
    const find = clientOthersParameters.find(
      (clientOtherParam) => clientOtherParam.dataValues.type === otherType.id,
    );
    if (find && vat_condition !== 20) {
      return {
        type: otherType.id,
        name: otherType.name,
        active: find.dataValues.active,
        AccountChart: find.dataValues.AccountChart,
        is_tax: otherType.is_tax,
        is_vat: false,
      };
    } else {
      return {
        type: otherType.id,
        name: otherType.name,
        active: false,
        AccountChart: null,
        is_tax: otherType.is_tax,
        is_vat: false,
      };
    }
  });
  return {
    vat: allClientVatParams,
    others: allClientOthersParams,
  };
};

export const paymentParameter = async (periodId: number) => {
  return await PointsSells.findAll({
    where: [{ accounting_period_id: periodId }],
    include: {
      model: AccountChart,
    },
  });
};

export interface invoiceFront {
  header: IHeaderReceiptReq;
  sellPoints: ISellPointReq[];
  concepts: IReceiptConcept[];
  taxes: ITaxesReceiptReq[];
  purchasePeriodId: number;
  customer: ICustomers;
  observations: string;
  checked: boolean;
  total: number;
}
