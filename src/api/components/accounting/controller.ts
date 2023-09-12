import { Op } from 'sequelize';
import { IAccountCharts, IAccountingPeriod } from '../../../interfaces/Tables';
import AccountingPeriod from '../../../models/AccountingPeriod';
import Client from '../../../models/Client';
import { error } from '../../../network/response';
import { Request, Response } from 'express';
import { Columns } from '../../../constant/TABLES';
import AccountChart from '../../../models/AccountCharts';
import { IAccountChartsToFront } from 'interfaces/Others';

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
        return await AccountingPeriod.create(newPeriod)
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

    const getAccountList = async (accountPeriodId: number) => {
        const accountingList = await AccountChart.findAll({
            where: { accounting_period_id: accountPeriodId },
            order: [
                [`${Columns.accountCharts.code}`, "ASC"]
            ]
        })
        let lastGenre = 0
        let lastGroup = 0
        let lastCaption = 0
        let lastAccount = 0
        let lastSubAccount = 0

        let countGenre = 0
        let countGroup = 0
        let countCaption = 0
        let countAccount = 0
        let countSubAccount = 0

        let list: Array<IAccountChartsToFront> = []

        accountingList.map((account, key) => {
            if (lastGenre < account.dataValues.genre &&
                account.dataValues.group === 0 &&
                account.dataValues.caption === 0 &&
                account.dataValues.account === 0 &&
                account.dataValues.sub_account === 0
            ) {

                lastGenre = account.dataValues.genre
                countGenre = countGenre + 1
                list.push({
                    id: account.dataValues.id,
                    genre: account.dataValues.genre,
                    group: account.dataValues.group,
                    caption: account.dataValues.caption,
                    account: account.dataValues.account,
                    sub_account: account.dataValues.sub_account,
                    code: account.dataValues.code,
                    name: account.dataValues.name,
                    attributable: account.dataValues.attributable,
                    inflation_adjustment: account.dataValues.inflation_adjustment,
                    accounting_period_id: account.dataValues.accounting_period_id,
                    open: false,
                    principal: true,
                    subAccounts: []
                })
                countGroup = 0
                countCaption = 0
                countAccount = 0
                countSubAccount = 0
                lastGroup = 0
                lastCaption = 0
                lastAccount = 0
                lastSubAccount = 0
            } else if (
                lastGroup < account.dataValues.group &&
                account.dataValues.caption === 0 &&
                account.dataValues.account === 0 &&
                account.dataValues.sub_account === 0
            ) {

                lastGroup = account.dataValues.group
                countGroup = countGroup + 1
                list[countGenre - 1].subAccounts.push({
                    id: account.dataValues.id,
                    genre: account.dataValues.genre,
                    group: account.dataValues.group,
                    caption: account.dataValues.caption,
                    account: account.dataValues.account,
                    sub_account: account.dataValues.sub_account,
                    code: account.dataValues.code,
                    name: account.dataValues.name,
                    attributable: account.dataValues.attributable,
                    inflation_adjustment: account.dataValues.inflation_adjustment,
                    accounting_period_id: account.dataValues.accounting_period_id,
                    open: false,
                    principal: false,
                    subAccounts: []
                })
                countCaption = 0
                countAccount = 0
                countSubAccount = 0
                lastCaption = 0
                lastAccount = 0
                lastSubAccount = 0
            } else if (
                lastCaption < account.dataValues.caption &&
                account.dataValues.account === 0 &&
                account.dataValues.sub_account === 0
            ) {

                lastCaption = account.dataValues.caption
                countCaption = countCaption + 1
                list[countGenre - 1].subAccounts[countGroup - 1].subAccounts.push({
                    id: account.dataValues.id,
                    genre: account.dataValues.genre,
                    group: account.dataValues.group,
                    caption: account.dataValues.caption,
                    account: account.dataValues.account,
                    sub_account: account.dataValues.sub_account,
                    code: account.dataValues.code,
                    name: account.dataValues.name,
                    attributable: account.dataValues.attributable,
                    inflation_adjustment: account.dataValues.inflation_adjustment,
                    accounting_period_id: account.dataValues.accounting_period_id,
                    open: false,
                    principal: false,
                    subAccounts: []
                })

                countAccount = 0
                countSubAccount = 0
                lastAccount = 0
                lastSubAccount = 0
            } else if (lastAccount < account.dataValues.account && account.dataValues.sub_account === 0) {

                lastAccount = account.dataValues.account
                countAccount = countAccount + 1

                list[countGenre - 1].subAccounts[countGroup - 1].subAccounts[countCaption - 1].subAccounts.push({
                    id: account.dataValues.id,
                    genre: account.dataValues.genre,
                    group: account.dataValues.group,
                    caption: account.dataValues.caption,
                    account: account.dataValues.account,
                    sub_account: account.dataValues.sub_account,
                    code: account.dataValues.code,
                    name: account.dataValues.name,
                    attributable: account.dataValues.attributable,
                    inflation_adjustment: account.dataValues.inflation_adjustment,
                    accounting_period_id: account.dataValues.accounting_period_id,
                    open: false,
                    principal: false,
                    subAccounts: []
                })

                countSubAccount = 0
                lastSubAccount = 0
            } else if (lastSubAccount < account.dataValues.sub_account) {
                lastSubAccount = account.dataValues.sub_account
                countSubAccount = countSubAccount + 1
                list[countGenre - 1].subAccounts[countGroup - 1].subAccounts[countCaption - 1].subAccounts[countAccount - 1].subAccounts.push({
                    id: account.dataValues.id,
                    genre: account.dataValues.genre,
                    group: account.dataValues.group,
                    caption: account.dataValues.caption,
                    account: account.dataValues.account,
                    sub_account: account.dataValues.sub_account,
                    code: account.dataValues.code,
                    name: account.dataValues.name,
                    attributable: account.dataValues.attributable,
                    inflation_adjustment: account.dataValues.inflation_adjustment,
                    accounting_period_id: account.dataValues.accounting_period_id,
                    open: false,
                    principal: false,
                    subAccounts: []
                })
            }
        })
        return list
    }


    const recursiveAccountsPush = (accountingList: Array<AccountChart>): Array<IAccountChartsToFront> | any => {

    }
    return {
        periodUpsert,
        periodList,
        getAccountList
    };
}