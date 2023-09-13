import { Op } from 'sequelize';
import { IAccountCharts, IAccountingPeriod } from '../../../interfaces/Tables';
import AccountingPeriod from '../../../models/AccountingPeriod';
import Client from '../../../models/Client';
import { error } from '../../../network/response';
import { Request, Response } from 'express';
import { Columns } from '../../../constant/TABLES';
import AccountChart from '../../../models/AccountCharts';
import { IAccountChartsToFront } from 'interfaces/Others';
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
        getAccountList
    };
}