import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express";
import err from "../network/error";
import { config } from '../config';
import AdminPermission from '../models/AdminPermission';
import { Op } from 'sequelize';

const checkClientAuth = async (req: Request, res: Response, next: NextFunction, permissionGrade: number) => {
    const isAdmin: boolean = req.body.user.admin
    const decoded: any = decodeHeader(req, next)
    const clientId = decoded.id

    const clientsUserPermissions = await AdminPermission.findAll({
        where: {
            client_id: clientId,
            user_id: req.body.user.id,
            permission_grade_id: { [Op.gte]: permissionGrade }
        }
    })

    if (clientsUserPermissions.length > 0 || isAdmin) {
        req.body.clientId = decoded.id
        next()
    } else {
        next(err("No tiene los token envíado"))
    }
}

export const checkClient = (permissionGrade: number) => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            checkClientAuth(req, res, next, permissionGrade)
        } catch (error) {
            next(err("No tiene los token envíado"))
        }
    }
    return middleware
}


const getToken = (auth: string, next: NextFunction) => {
    if (!auth) {
        next(err("No tiene los token envíado"))
    }

    if (auth.indexOf('Bearer ') === -1) {
        next(err("Formato invalido"))
    }

    return auth.replace('Bearer ', "")
};

const verify = (token: string) => {
    return jwt.verify(token, config.jwt.secret)
};

const decodeHeader = (req: Request, next: NextFunction) => {
    try {
        const authorization = req.headers.authorization || ""
        const clientAuth = authorization.split("||")[1]
        const token = getToken(clientAuth, next)
        const decoded = verify(token)

        return decoded
    } catch (error) {
        next(err("Token invalido"))
    }
};