import { NextFunction, Request, Response } from 'express';
import { success } from '../../../network/response';
import ClientPermission from '../../../models/ClientsPermissions';
import Module from '../../../models/Module';
import { getClientsPermissions } from './modules.fn';

export const getActiveModules = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number) {
        return await getClientsPermissions(clientId)
    })(Number(req.query.clientId)).then(data => success({ req, res, message: data })).catch(next)
}

export const getAllClientsModules = async (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number) {

        const allModules = await Module.findAll()
        const clientModules = await ClientPermission.findAll({
            where: {
                client_id: clientId,
                active: true
            }
        })

        return allModules.map(module => {
            const clientModule = clientModules.find(clientModule => clientModule.dataValues.module_id === module.dataValues.id)
            return {
                module_id: module.dataValues.id,
                name: module.dataValues.module_name,
                active: clientModule ? true : false
            }
        })
    })(Number(req.query.clientId)).then(data => success({ req, res, message: data })).catch(next)
}