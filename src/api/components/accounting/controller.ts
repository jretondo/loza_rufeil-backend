import { Op } from 'sequelize';
import { IAccountingPeriod } from '../../../interfaces/Tables';
import AccountingPeriod from '../../../models/AccountingPeriod';
import Client from '../../../models/Client';
import { error } from '../../../network/response';
import { Request, Response } from 'express';
import { Columns } from '../../../constant/TABLES';

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


    return {
        periodUpsert,
        periodList
    };
}