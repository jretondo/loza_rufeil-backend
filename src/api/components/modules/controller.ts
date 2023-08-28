import { Op } from 'sequelize';
import { INewPermissions } from '../../../interfaces/Others';
import AdminPermission from '../../../models/AdminPermission';
import { IUserPermission } from '../../../interfaces/Tables';
import Permission from '../../../models/Module';
import UserModules from '../../../models/UserModule';

export = () => {
    const upsert = async (body: INewPermissions) => {
        if (body.permissions.length > 0) {
            await AdminPermission.destroy({ where: { user_id: body.idUser } })

            const permissions: Array<IUserPermission> =
                body.permissions.map((item) => {
                    return {
                        permission_id: item.idPermission,
                        user_id: body.idUser,
                        permission_grade: item.permissionGrade,
                        client_id: item.idClient,
                        client_enabled: item.clientEnabled
                    }
                })

            return await AdminPermission.bulkCreate(permissions);
        } else {
            await AdminPermission.destroy({ where: { user_id: body.idUser } })
        }
    }

    const getModulePermission = async (idUser: number, idPermission: number, grade: number) => {
        return await UserModules.findAll({
            where: {
                [Op.and]:
                    [
                        { module_id: idPermission },
                        { user_id: idUser },
                        { permission_grade: { [Op.gte]: grade } }
                    ]
            }
        })
    }

    const getPermission = async (idUser: number, idPermission: number, idClient: number, grade: number) => {
        return await AdminPermission.findAll({
            where: {
                [Op.and]:
                    [
                        { permission_id: idPermission },
                        { user_id: idUser },
                        { client_enabled: true },
                        { client_id: idClient },
                        { permission_grade: { [Op.gte]: grade } }
                    ]
            }
        })
    }

    const get2 = async (idUser: number) => {
        const allPermissions = await Permission.findAll();

        const userPermissions = await AdminPermission.findAll({
            where: {
                user_id: idUser
            },
            include: Permission
        });

        const permissions: Array<any> = await new Promise((resolve, reject) => {
            const list: Array<any> = [];
            allPermissions.map((item: any, key: number) => {
                const PERMISSION_ID = item.id
                const found = userPermissions.find((element: any) => element.id_permission === PERMISSION_ID)
                if (!found) {
                    list.push(item);
                }
                if (key === allPermissions.length - 1) {
                    resolve(list);
                }
            });
        })

        return {
            userPermissions,
            permissions
        };
    }

    const get = async (idUser: number) => {
        return await AdminPermission.findAll({ where: { user_id: idUser } });
    }

    return {
        upsert,
        getPermission,
        getModulePermission,
        get,
        get2,
    };
}