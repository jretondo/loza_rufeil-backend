import { Op, Sequelize } from "sequelize"
import { Columns } from "../../../constant/TABLES"
import { IAccountChartsToFront } from "../../../interfaces/Others"
import { IAccountCharts } from "../../../interfaces/Tables"
import AccountChart from "../../../models/AccountCharts"
import AccountingPeriod from "../../../models/AccountingPeriod"
import Client from "../../../models/Client"

export const nextChildrenAccount = async (accountData: AccountChart | null): Promise<AccountChart | null> => {
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

export const accountChartItem = (account: IAccountCharts, principal: boolean): IAccountChartsToFront => {
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

export const initialAccountChart = (accountPeriodId: number): Array<IAccountCharts> => {
    return ([
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
    ])
}

export const newDefaultAccountCharts = async (accountPeriodId: number) => {
    if ((accountPeriodId) > 0) {
        return await AccountChart.bulkCreate(initialAccountChart(accountPeriodId))
    } else {
        return null
    }
}

export const periodListFn = async (clientId: number, fromDate?: Date, toDate?: Date) => {
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