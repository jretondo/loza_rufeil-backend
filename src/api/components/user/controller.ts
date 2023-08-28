import { IListResponse, IModulesPermissions, IPermissions, IUserModulesPermissions } from './../../../interfaces/Others';
import { Op, where } from 'sequelize';
import { IAuth, IUser, IUserModules, IUserPermission } from 'interfaces/Tables';;
import AuthController from '../auth/index';
import Admin from '../../../models/Admin';
import ClientsController from '../clients';
import AdminPermission from '../../../models/AdminPermission';
import Module from '../../../models/Module';
import Client from '../../../models/Client';
import ClientsPermissions from '../../../models/ClientsPermissions';
import UserModules from '../../../models/UserModule';

export = () => {
    const list = async (page?: number, item?: string, itemsPerPage?: number): Promise<IListResponse> => {
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
    }

    const upsert = async (body: IUser) => {
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
            return await AuthController.upsert(newAuth, body.email, `${body.name} ${body.lastname}`);
        }
    }

    const remove = async (userId: number) => {
        return await Admin.destroy({ where: { id: userId } })
    }

    const getUser = async (userId: number) => {
        return await Admin.findByPk(userId)
    }

    const getPermissionsUser = async (userId: number) => {
        const clients = await ClientsController.allList()
        const clientsPermissions = await ClientsPermissions.findAll()
        const permissions = await AdminPermission.findAll({ where: { user_id: userId } })
        let userPermissions: Array<IPermissions> = []
        return new Promise((resolve) => {
            clients.map((client, key1) => {
                const clientEnabled = permissions.filter(permission => permission.dataValues.client_id === client.dataValues.id)
                let modulesPermissions: Array<IModulesPermissions> = []
                clientsPermissions.map((clientPermission, key2) => {
                    const permission: Array<AdminPermission> = clientEnabled.filter(permission1 => permission1.dataValues.permission_id === clientPermission.dataValues.id)
                    modulesPermissions.push({
                        module_id: clientPermission.dataValues.id || 0,
                        module_name: clientPermission.dataValues.description,
                        permission_grade: permission[0]?.dataValues.permission_grade || 0
                    })
                    if (key2 === clientsPermissions.length - 1) {
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
    }

    const getPermissionsUserModules = async (userId: number) => {
        const modules = await Module.findAll()
        const modulePermissions = await UserModules.findAll({ where: { user_id: userId } })
        let userModulesPermissions: Array<IUserModulesPermissions> = []
        return new Promise((resolve) => {
            modules.map((module, key1) => {
                const moduleEnabled = modulePermissions.filter(permission => permission.dataValues.module_id === module.dataValues.id)
                userModulesPermissions.push({
                    module_id: module.dataValues.id || 0,
                    permission_grade: moduleEnabled[0]?.dataValues.permission_grade || 0,
                    module_name: module.dataValues.module_name
                })

                if (key1 === modules.length - 1) {
                    resolve(userModulesPermissions)
                }
            })
        })
    }

    const upsertUserPermissions = async (userId: number, permissionsList: Array<IPermissions>) => {
        let newPermissions: Array<IUserPermission> = []
        permissionsList.map((clientPermission, key1) => {
            clientPermission.modules.map(async (modulePermission, key2) => {
                newPermissions.push({
                    user_id: userId,
                    permission_id: modulePermission.module_id,
                    permission_grade: modulePermission.permission_grade,
                    client_id: clientPermission.client_id,
                    client_enabled: clientPermission.enabled
                })
                if (key1 === permissionsList.length - 1 && key2 === clientPermission.modules.length - 1) {
                    await AdminPermission.destroy({ where: { user_id: userId } })
                    return await AdminPermission.bulkCreate(newPermissions)
                }
            })
        })
    }

    const upsertUserModulesPermissions = async (userId: number, permissionsList: Array<IUserModulesPermissions>) => {
        let newPermissions: Array<IUserModules> = []
        permissionsList.map(async (modulePermission, key) => {
            newPermissions.push({
                user_id: userId,
                permission_grade: modulePermission.permission_grade,
                module_id: modulePermission.module_id
            })
            if (key === permissionsList.length - 1) {
                await UserModules.destroy({ where: { user_id: userId } })
                return await UserModules.bulkCreate(newPermissions)
            }
        })
    }

    return {
        list,
        upsert,
        remove,
        getUser,
        getPermissionsUser,
        upsertUserPermissions,
        getPermissionsUserModules,
        upsertUserModulesPermissions
    }
}
