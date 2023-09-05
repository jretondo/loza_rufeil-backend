import { IAccountingPeriod } from '../../../interfaces/Tables';
import AccountingPeriod from '../../../models/AccountingPeriod';
import Client from '../../../models/Client';

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
            include: Client
        });
    }

    return {
        periodUpsert,
        periodList
    };
}