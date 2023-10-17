import { NextFunction, Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { IAccountCharts, IAccountingPeriod } from '../../../interfaces/Tables';
import AccountingPeriod from '../../../models/AccountingPeriod';
import { error, success } from '../../../network/response';
import { Columns } from '../../../constant/TABLES';
import AccountChart from '../../../models/AccountCharts';
import { IAccountChartsToFront } from '../../../interfaces/Others';
import { accountControl } from '../../../utils/classes/AccountControl';
import {
    accountChartItem,
    newDefaultAccountCharts,
    nextChildrenAccount,
    periodListFn
} from './accounting.fn';

export const periodUpsert = async (req: Request, res: Response, next: NextFunction) => {
    (async function (
        fromDate: Date,
        toDate: Date,
        clientId: number
    ) {
        const periods = await periodListFn(clientId, fromDate, toDate)
        const newPeriod: IAccountingPeriod = {
            from_date: fromDate,
            to_date: toDate,
            client_id: clientId,
            closed: false
        }
        if (periods.length > 0) {
            throw error({
                status: 403,
                message: "El nuevo ejercicio no puede pisar uno ya cargado!",
                req,
                res
            })
        }
        const result = await AccountingPeriod.create(newPeriod)
        return newDefaultAccountCharts(result.dataValues.id || 0)
    })(
        req.body.fromDate,
        req.body.toDate,
        req.body.clientId
    ).then(data => success({ req, res, message: data })).catch(next)
}

export const periodList = async (req: Request, res: Response, next: NextFunction): Promise<Array<AccountingPeriod> | any> => {
    (async function (clientId: number, fromDate?: Date, toDate?: Date) {
        return periodListFn(clientId, fromDate, toDate)
    })(
        Number(req.query.clientId),
        req.body.fromDate,
        req.body.toDate
    ).then(data => success({ req, res, message: data })).catch(next)
}

export const getAccountList = async (req: Request, res: Response, next: NextFunction) => {
    (async function (accountPeriodId: number, contain?: string) {
        const accountingList = await AccountChart.findAll({
            where: [
                { accounting_period_id: accountPeriodId },
                { name: { [Op.like]: `%${contain}%` } }
            ],
            order: [[`${Columns.accountCharts.code}`, "ASC"]]
        })

        const control = new accountControl()

        let list: Array<IAccountChartsToFront> = []

        accountingList.map((account) => {
            if (control.last.genre < account.dataValues.genre) {
                list.push(accountChartItem(account.dataValues, true))
                control.lastGenre(account.dataValues.genre)
                control.addCountGenre()
            } else if (control.last.group < account.dataValues.group) {
                list[control.count.genre - 1]
                    .subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastGroup(account.dataValues.group)
                control.addCountGroup()
            } else if (control.last.caption < account.dataValues.caption) {
                list[control.count.genre - 1]
                    .subAccounts[control.count.group - 1]
                    .subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastCaption(account.dataValues.caption)
                control.addCountCaption()
            } else if (control.last.account < account.dataValues.account) {
                list[control.count.genre - 1]
                    .subAccounts[control.count.group - 1]
                    .subAccounts[control.count.caption - 1]
                    .subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastAccount(account.dataValues.account)
                control.addCountAccount()
            } else if (control.last.subAccount < account.dataValues.sub_account) {
                list[control.count.genre - 1]
                    .subAccounts[control.count.group - 1]
                    .subAccounts[control.count.caption - 1]
                    .subAccounts[control.count.account - 1]
                    .subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastSubAccount(account.dataValues.sub_account)
                control.addCountSubAccount()
            }
        })
        return list
    })(
        Number(req.body.periodId),
        String(req.query.contain ? req.query.contain : "")
    ).then(data => success({ req, res, message: data })).catch(next)
}

export const upsertAccountChart = async (req: Request, res: Response, next: NextFunction) => {
    (async function (account: IAccountCharts) {
        if (account.id) {
            return await AccountChart.update(account, { where: { id: account.id } })
        } else {
            return await AccountChart.create(account)
        }
    })(req.body.formData).then(data => success({ req, res, message: data })).catch(next)
}

export const deleteAccountChart = async (req: Request, res: Response, next: NextFunction) => {
    (async function (accountId: number) {
        const account = await AccountChart.findOne({ where: { id: accountId } })
        if (account) {
            if (account?.dataValues.sub_account > 0) {
                return await AccountChart.destroy({ where: { id: accountId } })
            } else if (account?.dataValues.account > 0) {
                const account = await AccountChart.findOne({ where: { id: accountId } })
                return await AccountChart.destroy({
                    where: [
                        { genre: account?.dataValues.genre },
                        { group: account?.dataValues.group },
                        { caption: account?.dataValues.caption },
                        { account: account?.dataValues.account }
                    ]
                })
            } else if (account?.dataValues.caption > 0) {
                const account = await AccountChart.findOne({ where: { id: accountId } })
                return await AccountChart.destroy({
                    where: [
                        { genre: account?.dataValues.genre },
                        { group: account?.dataValues.group },
                        { caption: account?.dataValues.caption }
                    ]
                })
            } else if (account?.dataValues.group > 0) {
                const account = await AccountChart.findOne({ where: { id: accountId } })
                return await AccountChart.destroy({
                    where: [
                        { genre: account?.dataValues.genre },
                        { group: account?.dataValues.group }
                    ]
                })
            }
        }
    })(Number(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}

export const copyPasteAccountsChart = async (req: Request, res: Response, next: NextFunction) => {
    (async function (original_period_id: number, copy_period_id: number) {
        const responseDelete = await AccountChart.destroy({ where: { accounting_period_id: original_period_id } })
        if (responseDelete > 0) {
            const copyAccounts = await AccountChart.findAll(
                {
                    attributes: {
                        include: [[Sequelize.literal(`${original_period_id}`), `${Columns.accountCharts.accounting_period_id}`]],
                        exclude: [`${Columns.accountCharts.id}`]
                    },
                    where: { accounting_period_id: copy_period_id }
                })
            return await AccountChart.bulkCreate(copyAccounts.map((account) => account.dataValues))
        } else {
            throw Error("No se pudo eliminar la cuenta original. Posiblemente haya movimientos asociados a esas cuentas.")
        }
    })(
        Number(req.body.original_period_id),
        Number(req.body.copy_period_id)
    ).then(data => success({ req, res, message: data })).catch(next)
}

export const getNewChildren = async (req: Request, res: Response, next: NextFunction) => {
    (async function (accountId: number) {
        const accountData = await AccountChart.findOne({ where: { id: accountId } })
        return await nextChildrenAccount(accountData)
    })(Number(req.body.periodId)).then(data => success({ req, res, message: data })).catch(next)
}

export const getAttributableAccounts = async (req: Request, res: Response, next: NextFunction) => {
    (async function (accountPeriodId: number) {
        return await AccountChart.findAll({
            where: [
                { accounting_period_id: accountPeriodId },
                { attributable: true }
            ],
            order: [[`${Columns.accountCharts.code}`, "ASC"]]
        })
    })(Number(req.body.periodId)).then(data => success({ req, res, message: data })).catch(next)
}