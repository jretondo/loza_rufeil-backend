import { NextFunction, Request, Response } from "express"
import { IPurchasePeriods } from "../../../interfaces/Tables"
import PurchasePeriod from "../../../models/PurchasePeriod"
import { success } from "../../../network/response"
import PurchaseParameter from "../../../models/PurchaseParameter"
import { othersTypes, vatTaxes } from "./purchase.const"
import AccountChart from "../../../models/AccountCharts"
import PaymentTypeParameter from "../../../models/PaymentTypeParameter"


export const upsertPurchasePeriod = async (req: Request, res: Response, next: NextFunction) => {
    (async function (purchasePeriod: IPurchasePeriods) {
        if (purchasePeriod.id) {
            return await PurchasePeriod.update(purchasePeriod, { where: { id: purchasePeriod.id } })
        } else {
            return await PurchasePeriod.create(purchasePeriod)
        }
    })({
        month: req.body.month,
        year: req.body.year,
        accounting_period_id: req.body.accounting_period_id,
        closed: req.body.closed
    }).then(data => success({ req, res, message: data })).catch(next)
}

export const listPurchasePeriods = async (req: Request, res: Response, next: NextFunction) => {
    (async function (accounting_period_id: number) {
        return await PurchasePeriod.findAll({
            where: {
                accounting_period_id: accounting_period_id
            }
        })
    })(Number(req.params.accounting_period_id)).then(data => success({ req, res, message: data })).catch(next)
}

export const getClientsParams = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number) {
        const clientVatParameters = await PurchaseParameter.findAll(
            { where: [{ client_id: clientId }, { is_vat: true }], include: [AccountChart] })
        const clientOthersParameters = await PurchaseParameter.findAll(
            { where: [{ client_id: clientId }, { is_vat: false }], include: [AccountChart] })

        const allClientVatParams = vatTaxes.map(vatTax => {
            const find = clientVatParameters.find(clientVatParam => clientVatParam.dataValues.type === vatTax.id)
            if (find) {
                return {
                    type: vatTax.id,
                    name: vatTax.name,
                    active: find.dataValues.active,
                    AccountChart: find.dataValues.AccountChart
                }
            } else {
                return {
                    type: vatTax.id,
                    name: vatTax.name,
                    active: false,
                    AccountChart: null
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
                    AccountChart: find.dataValues.AccountChart
                }
            } else {
                return {
                    type: otherType.id,
                    name: otherType.name,
                    active: false,
                    AccountChart: null
                }
            }
        })

        return {
            vat: allClientVatParams,
            others: allClientOthersParams
        }
    })(Number(req.body.clientId)).then(data => success({ req, res, message: data })).catch(next)
}

export const getPaymentsParametersClient = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number) {
        return await PaymentTypeParameter.findAll({
            where: { client_id: clientId },
            include: {
                model: AccountChart
            }
        })
    })(req.body.clientId).then(data => success({ req, res, message: data })).catch(next)
}

export const insertClientsParams = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number, params: any) {
        const vatParams = params.vat.map((vatParam: any) => {
            return {
                client_id: clientId,
                type: vatParam.type,
                account_chart_id: vatParam.AccountChart ? vatParam.AccountChart.id : null,
                is_vat: true,
                active: vatParam.active
            }
        })

        const othersParams = params.others.map((otherParam: any) => {
            return {
                client_id: clientId,
                type: otherParam.type,
                account_chart_id: otherParam.AccountChart ? otherParam.AccountChart.id : null,
                is_vat: false,
                active: otherParam.active
            }
        })
        const allParams = [...vatParams, ...othersParams]
        await PurchaseParameter.destroy({ where: { client_id: clientId } })
        return await PurchaseParameter.bulkCreate(allParams)
    })(req.body.clientId, req.body.params).then(data => success({ req, res, message: data })).catch(next)
}

export const insertPaymentsParametersClient = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number, params: any) {
        const paymentsParams = params.map((paymentParam: any) => {
            return {
                client_id: clientId,
                name: paymentParam.name,
                active: paymentParam.active,
                account_chart_id: paymentParam.AccountChart.id
            }
        })
        await PaymentTypeParameter.destroy({ where: { client_id: clientId } })
        return await PaymentTypeParameter.bulkCreate(paymentsParams)
    })(req.body.clientId, req.body.params).then(data => success({ req, res, message: data })).catch(next)
}