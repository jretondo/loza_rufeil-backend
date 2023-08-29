import { Op } from 'sequelize';
import { INewPermissions } from '../../../interfaces/Others';
import AdminPermission from '../../../models/AdminPermission';
import { IAdminPermission } from '../../../interfaces/Tables';
import Permission from '../../../models/Module';

export = () => {
    const upsert = async (body: INewPermissions) => {
        if (body.permissions.length > 0) {
            await AdminPermission.destroy({ where: { admin_id: body.idUser } })

            const permissions: Array<IAdminPermission> =
                body.permissions.map((item) => {
                    return {
                        module_id: item.idPermission,
                        admin_id: body.idUser,
                        permission_grade: item.permissionGrade,
                        client_id: item.idClient,
                        client_enabled: item.clientEnabled
                    }
                })

            return await AdminPermission.bulkCreate(permissions);
        } else {
            await AdminPermission.destroy({ where: { admin_id: body.idUser } })
        }
    }

    const getPermission = async (idUser: number, idPermission: number, idClient: number, grade: number) => {
        return await AdminPermission.findAll({
            where: {
                [Op.and]:
                    [
                        { module_id: idPermission },
                        { admin_id: idUser },
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
                admin_id: idUser
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
        return await AdminPermission.findAll({ where: { admin_id: idUser } });
    }

    return {
        upsert,
        getPermission,
        get,
        get2,
    };
}