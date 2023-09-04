import { Op } from 'sequelize';
import { IAccountingPeriod, IActivity } from '../../../interfaces/Tables';
import { IUser } from 'interfaces/Tables';
import Activity from '../../../models/Activity';
import Admin from '../../../models/Admin';
import AccountingPeriod from 'models/AccountingPeriod';

export = () => {
    const periodUpsert = async (fromDate: Date, toDate: Date, clientId: number) => {
        const newPeriod: IAccountingPeriod = {
            from_date: fromDate,
            to_date: toDate,
            client_id: clientId,
            closed: false
        }
        return await AccountingPeriod.create(newPeriod)
    }

    const periodList = async (clientId: number) => {
        return await AccountingPeriod.findAndCountAll({
            where: [{ client_id: clientId }],
            include: Admin,
        });
    }

    return {
        periodUpsert,
        periodList
    };
}