import { Op } from 'sequelize';
import { IActivity } from '../../../interfaces/Tables';
import { IUser } from 'interfaces/Tables';
import Activity from '../../../models/Activity';
import Admin from '../../../models/Admin';

export = () => {
    const upsert = async (user: IUser, activity_description: string) => {
        const newActivity: IActivity = {
            user_id: user.id || 0,
            activity_description: activity_description
        }
        const response = await Activity.create(newActivity)
        return response
    }

    const list = async (page: number, userId?: number, dateFrom?: string, dateTo?: string) => {
        const ITEMS_PER_PAGE = 6;

        const dateFromFilter = dateFrom ? { [Op.gte]: dateFrom + " 00:00:00" } : {};
        const dateToFilter = dateTo ? { [Op.lte]: dateTo + " 23:59:99" } : {};

        const filter = userId ? {
            user_id: userId,
            date: { [Op.and]: [dateFromFilter, dateToFilter] }
        } : {
            date: { [Op.and]: [dateFromFilter, dateToFilter] }
        };

        const offset = ((page || 1) - 1) * (ITEMS_PER_PAGE);
        const { count, rows } = await Activity.findAndCountAll({
            where: filter,
            include: Admin,
            offset: offset,
            limit: ITEMS_PER_PAGE
        });
        return {
            totalItems: count,
            itemsPerPage: ITEMS_PER_PAGE,
            pagesQuantity: Math.ceil(Number(count) / Number(ITEMS_PER_PAGE)),
            items: rows
        }

    }

    return {
        upsert,
        list
    };
}