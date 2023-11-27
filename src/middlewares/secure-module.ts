import { NextFunction, Request, Response } from "express";
import ClientPermission from "../models/ClientsPermissions";
import err from "../network/error";

const checkClientModule = async (req: Request, res: Response, next: NextFunction, idClient: number, moduleId: number) => {
    const modulesPermission = await ClientPermission.findAll({
        where: {
            client_id: idClient,
            module_id: moduleId
        }
    })

    if (modulesPermission.length > 0) {
        req.body.modulePermission = modulesPermission
        next()
    } else {
        next(err("No tiene permisos para el módulo"))
    }
}

export const checkModule = (moduleId: number) => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        checkClientModule(req, res, next, req.body.clientId, moduleId)
    }
    return middleware
}