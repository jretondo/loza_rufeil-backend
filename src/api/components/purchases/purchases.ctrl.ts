import { NextFunction, Request, Response } from "express"
import compressing from 'compressing';
import fs from 'fs';
import path from 'path';
import {
    IHeaderReceiptReq,
    IPaymentReceiptReq,
    IPaymentTypesParameters,
    IProviders,
    IPurchaseEntries,
    IPurchaseParameters,
    IReceiptConcept,
    IReceipts,
    ITaxesReceiptReq,
    IVatRatesReceipts
} from "../../../interfaces/Tables"
import PurchasePeriod from "../../../models/PurchasePeriod"
import { file, success } from "../../../network/response"
import PurchaseParameter from "../../../models/PurchaseParameter"
import { othersTypes, vatTaxes } from "./purchase.const"
import AccountChart from "../../../models/AccountCharts"
import PaymentTypeParameter from "../../../models/PaymentTypeParameter"
import Receipt from "../../../models/Receipts"
import Provider from "../../../models/Providers"
import VatRateReceipt from "../../../models/VatRateReceipt"
import { Op } from "sequelize"
import {
    checkDataReqReceipt,
    createPurchaseTxtItems,
    createPurchaseTxtVatRates,
    getDataSheet,
    jsonDataInvoiceGeneratorComplete,
    receiptsExcelGenerator
} from "./purchase.fn"
import PurchaseEntry from '../../../models/PurchaseEntries';
import ProviderParameter from "../../../models/ProviderParameter"
import { isDate } from "moment"
import { FILES_ADDRESS } from "../../../constant/FILES_ADDRESS";
import IvaCondition from "../../../models/IvaCondition";
import { clientDataTax } from "../../../utils/afip/dataTax";
import InvoiceType from "../../../models/InvoiceTypes";

export const listPurchasePeriods = async (req: Request, res: Response, next: NextFunction) => {
    (async function (accountingPeriodId: number, month?: number, year?: number) {
        if (month && year) {
            return await PurchasePeriod.findOne({
                where: { month, year, accounting_period_id: accountingPeriodId }
            })
        } else {
            return await PurchasePeriod.findAll({
                where: {
                    accounting_period_id: accountingPeriodId
                }
            })
        }
    })(Number(req.body.periodId), Number(req.query.month), Number(req.query.year)).then(data => success({ req, res, message: data })).catch(next)
}

export const getClientsParams = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number, periodId: number, vat_condition?: number) {

        const clientVatParameters = await PurchaseParameter.findAll(
            { where: [{ client_id: clientId }, { is_vat: true }, { accounting_period_id: periodId }], include: [AccountChart] })
        const clientOthersParameters = await PurchaseParameter.findAll(
            { where: [{ client_id: clientId }, { is_vat: false }, { accounting_period_id: periodId }], include: [AccountChart] })

        const allClientVatParams = vatTaxes.map(vatTax => {
            const find = clientVatParameters.find(clientVatParam => clientVatParam.dataValues.type === vatTax.id)
            if (find && vat_condition !== 20) {
                return {
                    type: vatTax.id,
                    name: vatTax.name,
                    active: find.dataValues.active,
                    AccountChart: find.dataValues.AccountChart,
                    is_tax: true,
                    is_vat: true
                }
            } else {
                return {
                    type: vatTax.id,
                    name: vatTax.name,
                    active: false,
                    AccountChart: null,
                    is_tax: true,
                    is_vat: true
                }
            }
        })

        const allClientOthersParams = othersTypes.map(otherType => {
            const find = clientOthersParameters.find(clientOtherParam => clientOtherParam.dataValues.type === otherType.id)
            if (find && vat_condition !== 20) {
                return {
                    type: otherType.id,
                    name: otherType.name,
                    active: find.dataValues.active,
                    AccountChart: find.dataValues.AccountChart,
                    is_tax: otherType.is_tax,
                    is_vat: false
                }
            } else {
                return {
                    type: otherType.id,
                    name: otherType.name,
                    active: false,
                    AccountChart: null,
                    is_tax: otherType.is_tax,
                    is_vat: false
                }
            }
        })
        return {
            vat: allClientVatParams,
            others: allClientOthersParams
        }
    })(Number(req.body.clientId), req.body.periodId, Number(req.query.vat_condition)).then(data => success({ req, res, message: data })).catch(next)
}

export const getPaymentsParametersClient = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number, periodId: number) {
        return await PaymentTypeParameter.findAll({
            where: [{ client_id: clientId }, { accounting_period_id: periodId }],
            include: {
                model: AccountChart
            }
        })
    })(req.body.clientId, req.body.periodId).then(data => success({ req, res, message: data })).catch(next)
}

export const insertClientsParams = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number, params: any, periodId: number) {
        const vatParams: [IPurchaseParameters] = params.vat.map((vatParam: IPurchaseParameters) => {
            return {
                client_id: clientId,
                type: vatParam.type,
                account_chart_id: vatParam.AccountChart ? vatParam.AccountChart.id : null,
                is_vat: true,
                active: vatParam.active,
                accounting_period_id: periodId
            }
        })

        const othersParams: [IPurchaseParameters] = params.others.map((otherParam: IPurchaseParameters) => {
            return {
                client_id: clientId,
                type: otherParam.type,
                account_chart_id: otherParam.AccountChart ? otherParam.AccountChart.id : null,
                is_vat: false,
                active: otherParam.active,
                accounting_period_id: periodId
            }
        })
        const allParams = [...vatParams, ...othersParams]
        await PurchaseParameter.destroy({ where: [{ client_id: clientId }, { accounting_period_id: periodId }] })
        return await PurchaseParameter.bulkCreate(allParams)
    })(req.body.clientId, req.body.params, req.body.periodId).then(data => success({ req, res, message: data })).catch(next)
}

export const insertPaymentsParametersClient = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number, params: any, periodId: number) {
        const paymentsParams: [IPaymentTypesParameters] = params.map((paymentParam: IPaymentTypesParameters) => {
            return {
                client_id: clientId,
                name: paymentParam.name,
                active: paymentParam.active,
                account_chart_id: paymentParam.AccountChart?.id || null,
                accounting_period_id: periodId
            }
        })
        await PaymentTypeParameter.destroy({ where: [{ client_id: clientId }, { accounting_period_id: periodId }] })
        return await PaymentTypeParameter.bulkCreate(paymentsParams)
    })(req.body.clientId, req.body.params, req.body.periodId).then(data => success({ req, res, message: data })).catch(next)
}

export const insertPeriod = async (req: Request, res: Response, next: NextFunction) => {
    (async function (month: number, year: number, periodId: number) {
        return await PurchasePeriod.create({ month, year, accounting_period_id: periodId })
    })(req.body.month, req.body.year, req.body.periodId).then(data => success({ req, res, message: data })).catch(next)
}

export const getReceipts = async (req: Request, res: Response, next: NextFunction) => {
    (async function (purchasePeriodId: number, page?: number, textSearched?: string, provider?: string) {
        if (page) {
            const ITEMS_PER_PAGE = 10;

            const offset = ((page || 1) - 1) * (ITEMS_PER_PAGE);

            const { count, rows } = await Receipt.findAndCountAll({
                where: [(textSearched ? {
                    [Op.or]: [
                        textSearched ? { number: textSearched } : {},
                        textSearched ? { sell_point: textSearched } : {},
                        isDate(textSearched) ? { date: textSearched } : {},
                    ]
                } : {}), { purchase_period_id: purchasePeriodId }],
                include: [VatRateReceipt, {
                    model: PurchaseEntry,
                    required: true,
                    include: [AccountChart],
                    separate: true,
                }, {
                        model: Provider,
                        required: true,
                        where: (provider ?
                            {
                                [Op.or]: [
                                    provider ? { business_name: { [Op.like]: `%${provider}%` } } : {},
                                    provider ? { document_number: { [Op.like]: `%${provider}%` } } : {},
                                ]
                            } : {})

                    }],
                offset: offset,
                limit: ITEMS_PER_PAGE
            });
            return {
                totalItems: count,
                itemsPerPage: ITEMS_PER_PAGE,
                items: rows
            }
        } else {
            return await Receipt.findAll({
                where: { purchase_period_id: purchasePeriodId },
                include: [Provider, VatRateReceipt, PurchaseEntry]
            })
        }
    })(Number(req.query.purchasePeriodId), Number(req.params.page), req.query.query && String(req.query.query), req.query.provider && String(req.query.provider)).then(data => success({ req, res, message: data })).catch(next)
}

export const checkReceipt = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    (async function (
        receiptHeader: IHeaderReceiptReq,
        paymentsReceipt: IPaymentReceiptReq[],
        taxesReceipt: ITaxesReceiptReq[],
        conceptsReceipt: IReceiptConcept[],
        purchasePeriodId: number,
        provider: IProviders,
        observations: string
    ) {
        return checkDataReqReceipt(
            receiptHeader,
            paymentsReceipt,
            taxesReceipt,
            conceptsReceipt,
            provider,
            purchasePeriodId,
            observations
        );
    })(
        req.body.header,
        req.body.payments,
        req.body.taxes,
        req.body.concepts,
        req.body.purchasePeriodId,
        req.body.provider,
        req.body.observations
    )
        .then((data) => success({ req, res, message: data }))
        .catch(next);
};


export const upsertReceipt = async (req: Request, res: Response, next: NextFunction) => {
    (async function (receiptHeader: IHeaderReceiptReq, paymentsReceipt: IPaymentReceiptReq[], taxesReceipt: ITaxesReceiptReq[], conceptsReceipt: IReceiptConcept[], purchasePeriodId: number, provider: IProviders, observations: string) {
        const newRecords: {
            NewReceipt: IReceipts,
            VatRatesReceipts: IVatRatesReceipts[],
            purchaseEntries: IPurchaseEntries[]
        } = checkDataReqReceipt(receiptHeader, paymentsReceipt, taxesReceipt, conceptsReceipt, provider, purchasePeriodId, observations)
        const accountingPeriod = await PurchasePeriod.findOne({ where: { id: purchasePeriodId } })
        const providerAccount = await ProviderParameter.findAll({
            where: [{ provider_id: provider.id }, { accounting_period_id: accountingPeriod?.dataValues.accounting_period_id }]
        })

        if (providerAccount.length === 0) {
            await ProviderParameter.create({
                provider_id: provider.id || 0,
                account_chart_id: conceptsReceipt[0].AccountChart?.id || null,
                accounting_period_id: conceptsReceipt[0].AccountChart?.accounting_period_id || null,
                active: true,
                description: conceptsReceipt[0].description
            })
        }

        const newReceipt = await Receipt.create(newRecords.NewReceipt)
        if (newReceipt.dataValues.id) {
            const newVatRates = newRecords.VatRatesReceipts.length > 0 ? await VatRateReceipt.bulkCreate(newRecords.VatRatesReceipts.map(vatRate => {
                return {
                    ...vatRate,
                    receipt_id: newReceipt.dataValues.id || 0
                }
            })) : [{}]

            const newPurchaseEntries = await PurchaseEntry.bulkCreate(newRecords.purchaseEntries.map(purchaseEntry => {
                return {
                    ...purchaseEntry,
                    receipt_id: newReceipt.dataValues.id || 0
                }
            }))
            if (newVatRates.length > 0 && newPurchaseEntries.length > 0) {
                return "Guardado con éxito!"
            } else {
                Receipt.destroy({ where: { id: newReceipt.dataValues.id } })
                throw new Error("Hubo un error al querer guardar el recibo")
            }
        } else {
            throw new Error("Hubo un error al querer guardar el recibo")
        }
    })(req.body.header, req.body.payments, req.body.taxes, req.body.concepts, req.body.purchasePeriodId, req.body.provider, req.body.observations).then(data => success({ req, res, message: data })).catch(next)
}

export const upsertReceipts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    (async function (
        receipts: {
            header: IHeaderReceiptReq;
            payments: IPaymentReceiptReq[];
            taxes: ITaxesReceiptReq[];
            concepts: IReceiptConcept[];
            provider: IProviders;
            observation: string;
        }[], purchase_period_id: number) {
        let receiptsError: any = []
        return receipts.map(async (receipt, key) => {
            try {

                const newRecords: {
                    NewReceipt: IReceipts;
                    VatRatesReceipts: IVatRatesReceipts[];
                    purchaseEntries: IPurchaseEntries[];
                } = checkDataReqReceipt(
                    receipt.header,
                    receipt.payments,
                    receipt.taxes,
                    receipt.concepts,
                    receipt.provider,
                    purchase_period_id,
                    receipt.observation
                );

                const accountingPeriod = await PurchasePeriod.findOne({
                    where: { id: purchase_period_id },
                });
                const providerAccount = await ProviderParameter.findAll({
                    where: [
                        { provider_id: receipt.provider.id },
                        {
                            accounting_period_id:
                                accountingPeriod?.dataValues.accounting_period_id || null,
                        },
                    ],
                });

                if (providerAccount.length === 0) {
                    await ProviderParameter.create({
                        provider_id: receipt.provider.id || 0,
                        account_chart_id: receipt.concepts[0].AccountChart?.id || null,
                        accounting_period_id:
                            receipt.concepts[0].AccountChart?.accounting_period_id || null,
                        active: true,
                        description: receipt.concepts[0].description,
                    });
                }

                const newReceipt = await Receipt.create(newRecords.NewReceipt);
                if (newReceipt.dataValues.id) {
                    const newVatRates =
                        newRecords.VatRatesReceipts.length > 0
                            ? await VatRateReceipt.bulkCreate(
                                newRecords.VatRatesReceipts.map((vatRate) => {
                                    return {
                                        ...vatRate,
                                        receipt_id: newReceipt.dataValues.id || 0,
                                    };
                                })
                            )
                            : [{}];

                    const newPurchaseEntries = await PurchaseEntry.bulkCreate(
                        newRecords.purchaseEntries.map((purchaseEntry) => {
                            return {
                                ...purchaseEntry,
                                receipt_id: newReceipt.dataValues.id || 0,
                            };
                        })
                    );
                    if (newVatRates.length > 0 && newPurchaseEntries.length > 0) {
                        //return "Guardado con éxito!";
                    } else {
                        Receipt.destroy({ where: { id: newReceipt.dataValues.id } });
                        throw new Error("Hubo un error al querer guardar el recibo");
                    }
                } else {
                    throw new Error("Hubo un error al querer guardar el recibo");
                }
            } catch (error) {
                console.log('error :>> ', error);
                receiptsError.push({
                    index: key,
                    error: error
                })
            }
            if (key === receipts.length - 1) {
                return receiptsError as any
            }
        })
    })(
        req.body.receipts,
        req.body.purchase_period_id
    )
        .then((data) => success({ req, res, message: data }))
        .catch(next);
};

export const deleteReceipt = async (req: Request, res: Response, next: NextFunction) => {
    (async function (receiptId: number) {
        return await Receipt.destroy({ where: { id: receiptId } })
    })(Number(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}

export const getReceipt = async (req: Request, res: Response, next: NextFunction) => {
    (async function (receiptId: number) {
        return await Receipt.findOne({
            where: { id: receiptId },
            include: [Provider, VatRateReceipt]
        })
    })(Number(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}

export const createPurchaseTxt = async (req: Request, res: Response, next: NextFunction) => {
    (async function (purchasePeriodId: number) {
        const receipts = await Receipt.findAll({
            where: { purchase_period_id: purchasePeriodId },
            include: [Provider, VatRateReceipt, PurchaseEntry]
        })
        const purchasePeriod = await PurchasePeriod.findOne({ where: { id: purchasePeriodId } })
        const receiptsTxt = createPurchaseTxtItems(receipts)
        const vatTxt = createPurchaseTxtVatRates(receipts)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileNameReceipts = `compras_${purchasePeriod?.dataValues.month}_${purchasePeriod?.dataValues.year}_${uniqueSuffix}.txt`
        const fileNameVat = `compras_iva_${purchasePeriod?.dataValues.month}_${purchasePeriod?.dataValues.year}_${uniqueSuffix}.txt`
        if (!fs.existsSync(FILES_ADDRESS.purchase)) {
            fs.mkdirSync(FILES_ADDRESS.purchase);
        }
        const newFolder = path.join(FILES_ADDRESS.purchase, `compras_${uniqueSuffix}`);
        if (!fs.existsSync(newFolder)) {
            fs.mkdirSync(newFolder);
        }
        const receiptFileRoute = path.join(newFolder, fileNameReceipts);
        const vatFileRoute = path.join(newFolder, fileNameVat);
        fs.writeFileSync(receiptFileRoute, receiptsTxt);
        fs.writeFileSync(vatFileRoute, vatTxt);

        return await compressing.tar.compressDir(newFolder, path.join(FILES_ADDRESS.purchase, `compras_${uniqueSuffix}.tar`)).then(() => {


            setTimeout(() => {
                fs.unlinkSync(path.join(FILES_ADDRESS.purchase, `compras_${uniqueSuffix}.tar`));
                fs.unlinkSync(receiptFileRoute)
                fs.unlinkSync(vatFileRoute);
                fs.rmdirSync(path.join(newFolder), { recursive: true });
            }, 5000);


            return {
                filePath: path.join(FILES_ADDRESS.purchase, `compras_${uniqueSuffix}.tar`),
                fileName: `compras_${uniqueSuffix}.tar`
            }
        }).catch((error) => {
            console.error(error)
            throw Error("No se pudo generar la solicitus de certificado y tampoco la llave privada.")
        })
    })(Number(req.params.purchaseId)).then(data => file(req, res, data.filePath, "application/x-gzip", data.fileName)).catch(next)
}

export const importCVSAfip = async (req: Request, res: Response, next: NextFunction) => {
    (async function (files: { file: Express.Multer.File[] }, accountingPeriodId: number) {
        if (files) {
            const file = files.file[0];
            const dataSheet: Array<string[]> = getDataSheet(file.path);
            //const dataProcessed = jsonDataInvoiceGenerator(dataSheet)
            const dataProcessed = jsonDataInvoiceGeneratorComplete(dataSheet)

            setTimeout(() => {
                fs.unlinkSync(file.path);
            }, 2500);
            const dataInvoice: Promise<IReceipts[]> = Promise.all(
                dataProcessed.map(async (data) => {

                    let provider_ = ""
                    let provider = await Provider.findOne({
                        where: [{
                            document_number: data.documentNumber,
                        }],
                        include: [IvaCondition,
                            {
                                model: ProviderParameter,
                                required: false,
                                where: [{ accounting_period_id: accountingPeriodId }],
                                include: [AccountChart]
                            }]
                    })

                    if (!provider) {
                        const providerData = await clientDataTax(
                            data.documentNumber
                        );
                        const taxes =
                            providerData.data?.datosRegimenGeneral?.impuesto || [];
                        let vatTax = 30
                        taxes.map((item) => {
                            switch (item.idImpuesto) {
                                case 30:
                                    vatTax = 30;
                                    break;
                                case 32:
                                    vatTax = 32;
                                    break;
                                case 20:
                                    vatTax = 20;
                                    break;
                                case 33:
                                    vatTax = 33;
                                    break;
                                case 34:
                                    vatTax = 34;
                                    break;
                                default:
                                    break;
                            }
                        });
                        let newProvider: IProviders
                        if (providerData.data?.datosGenerales) {
                            newProvider = {
                                document_type: 80,
                                document_number: String(data.documentNumber),
                                business_name:
                                    providerData.data?.datosGenerales.tipoPersona ===
                                        "FISICA"
                                        ? providerData.data.datosGenerales.apellido +
                                        " " +
                                        providerData.data.datosGenerales.nombre
                                        : providerData.data?.datosGenerales.razonSocial ||
                                        "",
                                fantasie_name:
                                    providerData.data?.datosGenerales.tipoPersona ===
                                        "FISICA"
                                        ? providerData.data.datosGenerales.apellido +
                                        " " +
                                        providerData.data.datosGenerales.nombre
                                        : providerData.data?.datosGenerales.razonSocial ||
                                        "",
                                iva_condition_id: vatTax,
                                direction:
                                    providerData.data?.datosGenerales.domicilioFiscal
                                        .direccion || "",
                                city:
                                    providerData.data?.datosGenerales.domicilioFiscal
                                        .descripcionProvincia || "",
                                activity_description:
                                    providerData.data?.datosRegimenGeneral?.actividad ? providerData.data?.datosRegimenGeneral?.actividad[0].descripcionActividad : "",
                            };
                        } else {
                            newProvider = {
                                document_type: 80,
                                document_number: String(data.documentNumber),
                                business_name: data.providerName,
                                fantasie_name: data.providerName,
                                iva_condition_id: 30,
                                direction: "",
                                city: "",
                                activity_description: ""
                            }
                        }

                        const newProvInserted = await Provider.create(newProvider)
                        provider = await Provider.findOne({
                            where: { id: newProvInserted.dataValues.id },
                            include: [
                                IvaCondition,
                                {
                                    model: ProviderParameter,
                                    required: false,
                                },
                            ],
                        });
                    }
                    return {
                        checked: false,
                        date: data.date,
                        invoice_type_id: data.invoiceType,
                        sell_point: data.sellPoint,
                        number: data.invoiceNumber,
                        total: data.totalInvoice,
                        unrecorded: data.totalInvoice - data.totalRecorded,
                        exempt_transactions: data.exemptOperation,
                        vat_withholdings: 0,
                        national_tax_withholdings: data.otherTributes,
                        gross_income_withholdings: 0,
                        local_tax_withholdings: 0,
                        internal_tax: 0,
                        vat_rates_quantity: 1,
                        provider_id: 0,
                        purchase_period_id: 0,
                        observation: "",
                        word: "",
                        receipt_type: data.invoiceType,
                        Provider: provider ? provider.dataValues : undefined,
                        ProviderRaw: provider_ ? provider_ : undefined,
                        provider_name: data.providerName,
                        provider_document: data.documentNumber,
                        VatRatesReceipts: [
                            data["0_00VatBase"] && {
                                receipt_id: 0,
                                vat_type_id: 3,
                                vat_amount: 0,
                                recorded_net: data["0_00VatBase"]
                            },
                            data["2_50VatBase"] && {
                                receipt_id: 0,
                                vat_type_id: 9,
                                vat_amount: data["2_50Vat"],
                                recorded_net: data["2_50VatBase"]
                            },
                            data["5_00VatBase"] && {
                                receipt_id: 0,
                                vat_type_id: 8,
                                vat_amount: data["5_00Vat"],
                                recorded_net: data["5_00VatBase"]
                            },
                            data["10_50VatBase"] && {
                                receipt_id: 0,
                                vat_type_id: 4,
                                vat_amount: data["10_50Vat"],
                                recorded_net: data["10_50VatBase"]
                            },
                            data["21_00VatBase"] && {
                                receipt_id: 0,
                                vat_type_id: 5,
                                vat_amount: data["21_00Vat"],
                                recorded_net: data["21_00VatBase"]
                            },
                            data["27_00VatBase"] && {
                                receipt_id: 0,
                                vat_type_id: 5,
                                vat_amount: data["27_00Vat"],
                                recorded_net: data["27_00VatBase"]
                            },
                            data["vatWithholdings"] && {
                                receipt_id: 0,
                                vat_type_id: 12,
                                vat_amount: data["vatWithholdings"],
                                recorded_net: 0
                            },
                            data["nationalTaxes"] && {
                                receipt_id: 0,
                                vat_type_id: 13,
                                vat_amount: data["nationalTaxes"],
                                recorded_net: 0
                            },
                            data["grossIncome"] && {
                                receipt_id: 0,
                                vat_type_id: 14,
                                vat_amount: data["grossIncome"],
                                recorded_net: 0
                            },
                            data["localTaxes"] && {
                                receipt_id: 0,
                                vat_type_id: 15,
                                vat_amount: data["localTaxes"],
                                recorded_net: 0
                            },
                            data["internalTaxes"] && {
                                receipt_id: 0,
                                vat_type_id: 16,
                                vat_amount: data["internalTaxes"],
                                recorded_net: 0
                            }
                        ],
                    }
                })
            )
            return dataInvoice;
        } else {
            throw new Error("No se encontró el archivo")
        }
    })(req.files as { file: Express.Multer.File[] }, req.body.accountingPeriodId).then(data => success({ req, res, message: data })).catch(next)
}

export const getPeriodTotals = async (req: Request, res: Response, next: NextFunction) => {
    (async function (purchasePeriodId: number) {
        const receipts = await Receipt.findAll({
            where: { purchase_period_id: purchasePeriodId },
            include: [Provider, VatRateReceipt, PurchaseEntry]
        })
        const total = receipts.reduce((total, receipt) => {
            return {
                Total: total.Total + Number(receipt.dataValues.total),
                Total_No_Grabado: total.Total_No_Grabado + Number(receipt.dataValues.unrecorded),
                Total_Grabado: total.Total_Grabado + Number(receipt.dataValues.VatRateReceipts?.map(vatRate => vatRate?.recorded_net).reduce((total, recorded) => total + (recorded || 0), 0) || 0),
                Transacciones_Exentas: total.Transacciones_Exentas + Number(receipt.dataValues.exempt_transactions),
                Percepciones_IVA: total.Percepciones_IVA + Number(receipt.dataValues.vat_withholdings),
                Percepciones_Nacionales: total.Percepciones_Nacionales + Number(receipt.dataValues.national_tax_withholdings),
                Percepciones_IIBB: total.Percepciones_IIBB + Number(receipt.dataValues.gross_income_withholdings),
                Percepciones_Municipales: total.Percepciones_Municipales + Number(receipt.dataValues.local_tax_withholdings),
                Impuestos_Internos: total.Impuestos_Internos + Number(receipt.dataValues.internal_tax),
                Tota_IVA: total.Tota_IVA + Number((receipt.dataValues.VatRateReceipts?.map(vatRate => vatRate?.vat_amount).reduce((total, vatAmount) => total + (vatAmount || 0), 0) || 0))
            }
        }, {
            Total: 0,
            Total_No_Grabado: 0,
            Total_Grabado: 0,
            Transacciones_Exentas: 0,
            Percepciones_IVA: 0,
            Impuestos_Internos: 0,
            Percepciones_IIBB: 0,
            Percepciones_Municipales: 0,
            Percepciones_Nacionales: 0,
            Tota_IVA: 0,
        })
        return total
    })(Number(req.query.purchasePeriodId)).then(data => success({ req, res, message: data })).catch(next)
}

export const getExcelReceips = async (req: Request, res: Response, next: NextFunction) => {
    (async function (purchasePeriodId: number) {
        const receipts = await Receipt.findAll({
            where: { purchase_period_id: purchasePeriodId },
            include: [Provider, VatRateReceipt, PurchaseEntry]
        }).then(receipts => receipts.map(receipt => receipt.dataValues))
        return receiptsExcelGenerator(receipts)
    })(Number(req.body.purchasePeriodId))
        .then(data => file(req, res, data.excelAddress,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            data.fileName))
        .catch(next)
}