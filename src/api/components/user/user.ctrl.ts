import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { IModulesPermissions, IPermissions } from '../../../interfaces/Others';
import { IAdminPermission, IAuth, IUser } from '../../../interfaces/Tables';;
import Admin from '../../../models/Admin';
import AdminPermission from '../../../models/AdminPermission';
import Module from '../../../models/Module';
import { authUpsert } from '../auth/auth.ctrl';
import Client from '../../../models/Client';
import { success } from '../../../network/response';

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

export const getUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number) {

        const clients = await Client.findAll({ include: [{ model: AdminPermission }] })
        const Modules = await Module.findAll()
        const permissions = await AdminPermission.findAll({ where: { admin_id: userId } })
        let userPermissions: Array<IPermissions> = []
        return new Promise((resolve) => {
            clients.map((client, key1) => {
                const clientEnabled = permissions.filter(permission => permission.dataValues.client_id === client.dataValues.id)
                let modulesPermissions: Array<IModulesPermissions> = []
                Modules.map((Module, key2) => {
                    const permission: Array<AdminPermission> = clientEnabled.filter(permission1 => permission1.dataValues.module_id === Module.dataValues.id)
                    modulesPermissions.push({
                        module_id: Module.dataValues.id || 0,
                        module_name: Module.dataValues.module_name,
                        permission_grade: permission[0]?.dataValues.permission_grade || 0
                    })
                    if (key2 === Modules.length - 1) {
                        userPermissions.push({
                            client_id: client.dataValues.id || 0,
                            business_name: client.dataValues.business_name,
                            enabled: clientEnabled[0]?.dataValues.client_enabled || false,
                            modules: modulesPermissions
                        })
                        if (key1 === clients.length - 1) {
                            resolve(userPermissions)
                        }
                    }
                })
            })
        })
    })(Number(req.query.idUser)).then(data => success({ req, res, message: data })).catch(next)
}

export const upsertUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number, permissionsList: Array<IPermissions>) {
        let newPermissions: Array<IAdminPermission> = []
        permissionsList.map((clientPermission, key1) => {
            clientPermission.modules.map(async (modulePermission, key2) => {
                newPermissions.push({
                    admin_id: userId,
                    module_id: modulePermission.module_id,
                    permission_grade: modulePermission.permission_grade,
                    client_id: clientPermission.client_id,
                    client_enabled: clientPermission.enabled
                })
                if (key1 === permissionsList.length - 1 && key2 === clientPermission.modules.length - 1) {
                    await AdminPermission.destroy({ where: { admin_id: userId } })
                    return await AdminPermission.bulkCreate(newPermissions)
                }
            })
        })
    })(Number(req.body.idUser), req.body.permissionsList).then(data => success({ req, res, message: data })).catch(next)
}

export const getModules = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId: number, clientId: number) {
        return AdminPermission.findAll({
            where: [
                { admin_id: userId },
                { client_id: clientId },
                { client_enabled: true },
                { permission_grade: { [Op.gte]: 1 } }
            ]
        })
    })(Number(req.body.user.admin_id), Number(req.query.clientId)).then(data => success({ req, res, message: data })).catch(next)
}