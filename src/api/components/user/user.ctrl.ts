import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { IPermissions } from '../../../interfaces/Others';
import { IAdminPermission, IAuth, IUser } from '../../../interfaces/Tables';;
import Admin from '../../../models/Admin';
import AdminPermission from '../../../models/AdminPermission';
import { authUpsert } from '../auth/auth.ctrl';
import { success } from '../../../network/response';
import { userPermissions } from './user.fn';
import Client from '../../../models/Client';

export const list = async (req: Request, res: Response, next: NextFunction) => {
    (async function (page?: number, item?: string, itemsPerPage?: number) {
        if (page) {
            const offset = ((page || 1) - 1) * (itemsPerPage || 10)
            const { count, rows } = await Admin.findAndCountAll({
                where: {
                    [Op.and]: item ? {
                        [Op.or]: [
                            { lastname: { [Op.substring]: item } },
                            { email: { [Op.substring]: item } },
                            { name: { [Op.substring]: item } },
                            { user: { [Op.substring]: item } },
                            { phone: { [Op.substring]: item } }
                        ]
                    } : {},
                },
                offset: offset,
                limit: itemsPerPage || 10
            })
            return {
                totalItems: count,
                itemsPerPage: itemsPerPage || 10,
                items: rows
            }
        } else {
            const rows = await Admin.findAll({
                where: {
                    [Op.and]: item ? {
                        [Op.or]: [
                            { lastname: { [Op.substring]: item } },
                            { email: { [Op.substring]: item } },
                            { name: { [Op.substring]: item } },
                            { user: { [Op.substring]: item } },
                            { phone: { [Op.substring]: item } }
                        ]
                    } : {},
                }
            })
            return {
                totalItems: 1,
                itemsPerPage: 1,
                items: rows
            }
        }
    })(
        Number(req.params.page),
        String(req.query.query ? req.query.query : ""),
        Number(req.query.cantPerPage)
    ).then(data => success({ req, res, message: data })).catch(next)
}

export const upsert = async (req: Request, res: Response, next: NextFunction) => {
    (async function (body: IUser) {
        const user: IUser = {
            name: body.name,
            lastname: body.lastname,
            email: body.email,
            user: body.userName || "",
            phone: body.phone
        }

        if (body.id) {
            return await Admin.update(user, { where: { id: body.id } });
        } else {
            const result = await Admin.create(user)

            const newAuth: IAuth = {
                id: result.dataValues.id,
                user: user.user,
                prov: 1,
                admin_id: result.dataValues.id || 0
            }
            return await authUpsert(newAuth, body.email, `${body.name} ${body.lastname}`);
        }
    })(req.body).then(data => success({ req, res, message: data })).catch(next)
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number) {
        return await Admin.destroy({ where: { id: userId } })
    })(Number(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number) {
        return await Admin.findByPk(userId)
    })(Number(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}

export const getMyUserData = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number) {
        return await Admin.findByPk(userId)
    })(Number(req.body.user.admin_id)).then(data => success({ req, res, message: data })).catch(next)
}

export const upsertUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number, permissionsList: Array<IPermissions>) {
        await AdminPermission.destroy({ where: { user_id: userId } })
        const permissions: Array<IAdminPermission> = []
        permissionsList.map(permission => {
            permissions.push({
                user_id: userId,
                client_id: permission.client_id,
                permission_grade_id: permission.permission_grade_id,
            })
        })
        return await AdminPermission.bulkCreate(permissions)
    })(Number(req.body.idUser), req.body.permissionsList).then(data => success({ req, res, message: data })).catch(next)
}

export const getUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number, clientId: number) {
        return userPermissions(userId, clientId, 1)
    })(Number(req.body.user.admin_id), Number(req.query.clientId)).then(data => success({ req, res, message: data })).catch(next)
}

export const getUserClients = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number) {
        const userClients = await AdminPermission.findAll({
            where: [
                { user_id: userId }
            ]
        })
        const allClients = await Client.findAll()
        return allClients.map(client => {
            const userClient = userClients.find(userClient => userClient.dataValues.client_id === client.dataValues.id)
            return {
                client_id: client.dataValues.id,
                business_name: client.dataValues.business_name,
                permission_grade_id: userClient ? userClient.dataValues.permission_grade_id : 0
            }
        })
    })(Number(req.query.idUser)).then(data => success({ req, res, message: data })).catch(next)
}