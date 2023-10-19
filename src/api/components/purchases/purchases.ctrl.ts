import { NextFunction, Request, Response } from "express"
import { IHeaderReceiptReq, IPaymentReceiptReq, IPaymentTypesParameters, IProviders, IPurchaseEntries, IPurchaseParameters, IReceiptConcept, IReceipts, ITaxesReceiptReq, IVatRatesReceipts } from "../../../interfaces/Tables"
import PurchasePeriod from "../../../models/PurchasePeriod"
import { success } from "../../../network/response"
import PurchaseParameter from "../../../models/PurchaseParameter"
import { othersTypes, vatTaxes } from "./purchase.const"
import AccountChart from "../../../models/AccountCharts"
import PaymentTypeParameter from "../../../models/PaymentTypeParameter"
import Receipt from "../../../models/Receipts"
import Provider from "../../../models/Providers"
import VatRateReceipt from "../../../models/VatRateReceipt"
import { Op } from "sequelize"
import { checkDataReqReceipt } from "./purchase.fn"
import PurchaseEntry from '../../../models/PurchaseEntries';

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
    (async function (clientId: number, periodId: number) {
        const clientVatParameters = await PurchaseParameter.findAll(
            { where: [{ client_id: clientId }, { is_vat: true }, { accounting_period_id: periodId }], include: [AccountChart] })
        const clientOthersParameters = await PurchaseParameter.findAll(
            { where: [{ client_id: clientId }, { is_vat: false }, { accounting_period_id: periodId }], include: [AccountChart] })

        const allClientVatParams = vatTaxes.map(vatTax => {
            const find = clientVatParameters.find(clientVatParam => clientVatParam.dataValues.type === vatTax.id)
            if (find) {
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
            if (find) {
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
    })(Number(req.body.clientId), req.body.periodId).then(data => success({ req, res, message: data })).catch(next)
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
    (async function (purchasePeriodId: number, page?: number, textSearched?: string) {
        console.log('purchasePeriodId :>> ', purchasePeriodId);
        if (page) {
            const ITEMS_PER_PAGE = 10;

            const offset = ((page || 1) - 1) * (ITEMS_PER_PAGE);
            const { count, rows } = await Receipt.findAndCountAll({
                where: { purchase_period_id: purchasePeriodId },
                include: [VatRateReceipt, {
                    model: Provider,
                    required: false

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
                include: [Provider, VatRateReceipt]
            })
        }
    })(Number(req.query.purchasePeriodId), Number(req.params.page), String(req.query.textSearched)).then(data => success({ req, res, message: data })).catch(next)
}

export const upsertReceipt = async (req: Request, res: Response, next: NextFunction) => {
    (async function (receiptHeader: IHeaderReceiptReq, paymentsReceipt: IPaymentReceiptReq[], taxesReceipt: ITaxesReceiptReq[], conceptsReceipt: IReceiptConcept[], purchasePeriodId: number, provider: IProviders, observations: string) {
        const newRecords: {
            NewReceipt: IReceipts,
            VatRatesReceipts: IVatRatesReceipts[],
            purchaseEntries: IPurchaseEntries[]
        } = checkDataReqReceipt(receiptHeader, paymentsReceipt, taxesReceipt, conceptsReceipt, provider, purchasePeriodId, observations)

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