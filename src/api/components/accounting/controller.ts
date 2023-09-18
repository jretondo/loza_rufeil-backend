import { Op, Sequelize } from 'sequelize';
import { IAccountCharts, IAccountingPeriod } from '../../../interfaces/Tables';
import AccountingPeriod from '../../../models/AccountingPeriod';
import Client from '../../../models/Client';
import { error } from '../../../network/response';
import { Request, Response } from 'express';
import { Columns } from '../../../constant/TABLES';
import AccountChart from '../../../models/AccountCharts';
import { IAccountChartsToFront } from '../../../interfaces/Others';
import { accountControl } from '../../../utils/classes/AccountControl';

export = () => {
    const periodUpsert = async (fromDate: Date, toDate: Date, clientId: number, res: Response, req: Request) => {
        const periods = await periodList(clientId, fromDate, toDate)
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
        console.log('result :>> ', result);
        return newDefaultAccountCharts(result.dataValues.id || 0)

    }

    const newDefaultAccountCharts = async (accountPeriodId: number) => {
        console.log('accountPeriodId :>> ', accountPeriodId);
        if ((accountPeriodId) > 0) {
            const newAccountsCharts: Array<IAccountCharts> = [
                {
                    genre: 1,
                    group: 0,
                    caption: 0,
                    account: 0,
                    sub_account: 0,
                    inflation_adjustment: false,
                    attributable: false,
                    code: "100000000",
                    name: "ACTIVO",
                    accounting_period_id: accountPeriodId
                },
                {
                    genre: 2,
                    group: 0,
                    caption: 0,
                    account: 0,
                    sub_account: 0,
                    inflation_adjustment: false,
                    attributable: false,
                    code: "200000000",
                    name: "PASIVO",
                    accounting_period_id: accountPeriodId
                },
                {
                    genre: 3,
                    group: 0,
                    caption: 0,
                    account: 0,
                    sub_account: 0,
                    inflation_adjustment: false,
                    attributable: false,
                    code: "300000000",
                    name: "PATRIMONIO NETO",
                    accounting_period_id: accountPeriodId
                },
                {
                    genre: 4,
                    group: 0,
                    caption: 0,
                    account: 0,
                    sub_account: 0,
                    inflation_adjustment: false,
                    attributable: false,
                    code: "400000000",
                    name: "RESULTADO POSITIVO",
                    accounting_period_id: accountPeriodId
                },
                {
                    genre: 5,
                    group: 0,
                    caption: 0,
                    account: 0,
                    sub_account: 0,
                    inflation_adjustment: false,
                    attributable: false,
                    code: "500000000",
                    name: "RESULTADO NEGATIVO",
                    accounting_period_id: accountPeriodId
                }
            ]
            console.log('newAccountsCharts :>> ', newAccountsCharts);
            return AccountChart.bulkCreate(newAccountsCharts)
        } else {
            return null
        }
    }

    const periodList = async (clientId: number, fromDate?: Date, toDate?: Date) => {
        if (fromDate) {
            return await AccountingPeriod.findAll({
                where:
                {
                    [Op.and]: [
                        { client_id: clientId },
                        {
                            [Op.and]: [
                                { from_date: { [Op.lte]: toDate } },
                                { to_date: { [Op.gte]: fromDate } }
                            ]
                        }]
                },
                include: Client
            });
        }

        return await AccountingPeriod.findAll({
            where: [{ client_id: clientId }],
            order: [[`${Columns.accountingPeriod.from_date}`, 'DESC']],
            include: Client
        });
    }

    const getAccountList = async (accountPeriodId: number, contain?: string) => {
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
                list[control.count.genre - 1].subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastGroup(account.dataValues.group)
                control.addCountGroup()
            } else if (control.last.caption < account.dataValues.caption) {
                list[control.count.genre - 1].subAccounts[control.count.group - 1].subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastCaption(account.dataValues.caption)
                control.addCountCaption()
            } else if (control.last.account < account.dataValues.account) {
                list[control.count.genre - 1].subAccounts[control.count.group - 1].subAccounts[control.count.caption - 1].subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastAccount(account.dataValues.account)
                control.addCountAccount()
            } else if (control.last.subAccount < account.dataValues.sub_account) {
                list[control.count.genre - 1].subAccounts[control.count.group - 1].subAccounts[control.count.caption - 1].subAccounts[control.count.account - 1].subAccounts.push(accountChartItem(account.dataValues, false))
                control.lastSubAccount(account.dataValues.sub_account)
                control.addCountSubAccount()
            }
        })
        return list
    }

    const upsertAccountChart = async (account: IAccountCharts) => {
        if (account.id) {
            return await AccountChart.update(account, { where: { id: account.id } })
        } else {
            return await AccountChart.create(account)
        }
    }

    const deleteAccountChart = async (accountId: number) => {
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
    }

    const getNewChildren = async (accountId: number) => {
        const accountData = await AccountChart.findOne({ where: { id: accountId } })
        return await nextChildrenAccount(accountData)
    }

    const nextChildrenAccount = async (accountData: AccountChart | null): Promise<AccountChart | null> => {
        if (accountData?.dataValues.group === 0) {
            let nextAccount: AccountChart | null = await AccountChart.findOne({
                attributes: {
                    include: [[Sequelize.literal("`" + `${Columns.accountCharts.group}` + "`" + ` + 1`), `${Columns.accountCharts.group}`]],
                    exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
                },
                where: [
                    { genre: accountData.dataValues.genre },
                    { group: { [Op.gt]: 0 } },
                    { caption: 0 },
                    { account: 0 },
                    { sub_account: 0 },
                    { accounting_period_id: accountData.dataValues.accounting_period_id }
                ],
                order: [[`${Columns.accountCharts.group}`, "DESC"]]
            })
            if (nextAccount?.dataValues) {
                return nextAccount
            } else {
                nextAccount = accountData
                nextAccount.dataValues.group = 1
                return nextAccount
            }
        } else if (accountData?.dataValues.caption === 0) {
            let nextAccount: AccountChart | null = await AccountChart.findOne({
                attributes: {
                    include: [[Sequelize.literal("`" + `${Columns.accountCharts.caption}` + "`" + ` + 1`), `${Columns.accountCharts.caption}`]],
                    exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
                },
                where: [
                    { genre: accountData.dataValues.genre },
                    { group: accountData.dataValues.group },
                    { caption: { [Op.gt]: 0 } },
                    { account: 0 },
                    { sub_account: 0 },
                    { accounting_period_id: accountData.dataValues.accounting_period_id }
                ],
                order: [[`${Columns.accountCharts.caption}`, "DESC"]]
            })
            if (nextAccount?.dataValues) {
                return nextAccount
            } else {
                nextAccount = accountData
                nextAccount.dataValues.caption = 1
                return nextAccount
            }
        } else if (accountData?.dataValues.account === 0) {
            let nextAccount: AccountChart | null = await AccountChart.findOne({
                attributes: {
                    include: [[Sequelize.literal("`" + `${Columns.accountCharts.account}` + "`" + ` + 1`), `${Columns.accountCharts.account}`]],
                    exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
                },
                where: [
                    { genre: accountData.dataValues.genre },
                    { group: accountData.dataValues.group },
                    { caption: accountData.dataValues.caption },
                    { account: { [Op.gt]: 0 } },
                    { sub_account: 0 },
                    { accounting_period_id: accountData.dataValues.accounting_period_id }
                ],
                order: [[`${Columns.accountCharts.account}`, "DESC"]]
            })
            if (nextAccount?.dataValues) {
                return nextAccount
            } else {
                nextAccount = accountData
                nextAccount.dataValues.account = 1
                return nextAccount
            }
        } else if (accountData?.dataValues.sub_account === 0) {
            let nextAccount: AccountChart | null = await AccountChart.findOne({
                attributes: {
                    include: [[Sequelize.literal("`" + `${Columns.accountCharts.sub_account}` + "`" + ` + 1`), `${Columns.accountCharts.sub_account}`]],
                    exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
                },
                where: [
                    { genre: accountData.dataValues.genre },
                    { group: accountData.dataValues.group },
                    { caption: accountData.dataValues.caption },
                    { account: accountData.dataValues.account },
                    { sub_account: { [Op.gt]: 0 } },
                    { accounting_period_id: accountData.dataValues.accounting_period_id }
                ],
                order: [[`${Columns.accountCharts.sub_account}`, "DESC"]]
            })
            if (nextAccount?.dataValues) {
                return nextAccount
            } else {
                nextAccount = accountData
                nextAccount.dataValues.sub_account = 1
                return nextAccount
            }
        }
        return null
    }

    const accountChartItem = (account: IAccountCharts, principal: boolean): IAccountChartsToFront => {
        return {
            id: account.id,
            genre: account.genre,
            group: account.group,
            caption: account.caption,
            account: account.account,
            sub_account: account.sub_account,
            code: account.code,
            name: account.name,
            attributable: account.attributable,
            inflation_adjustment: account.inflation_adjustment,
            accounting_period_id: account.accounting_period_id,
            principal: principal,
            subAccounts: []
        }
    }

    return {
        periodUpsert,
        periodList,
        getAccountList,
        getNewChildren,
        upsertAccountChart,
        deleteAccountChart
    };
}