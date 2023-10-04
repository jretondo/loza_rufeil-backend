import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { IActivity, IUser } from '../../../interfaces/Tables';
import Activity from '../../../models/Activity';
import Admin from '../../../models/Admin';
import { success } from '../../../network/response';

export const upsert = async (req: Request, res: Response, next: NextFunction) => {
    (async function (
        user: IUser,
        activity_description: string
    ) {
        const newActivity: IActivity = {
            user_id: user.id || 0,
            activity_description: activity_description
        }
        const response = await Activity.create(newActivity)
        return response
    })(req.body.user, req.body.activityDescription).then(data => success({ req, res, message: data })).catch(next)
}

export const list = async (req: Request, res: Response, next: NextFunction) => {
    (async function (
        page: number,
        userId?: number,
        dateFrom?: string,
        dateTo?: string
    ) {
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
    })(
        Number(req.params.page),
        Number(req.query.userId),
        String(req.query.dateFrom),
        String(req.query.dateTo)
    ).then(data => success({ req, res, message: data })).catch(next)
}