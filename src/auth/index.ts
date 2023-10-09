import { Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import err from '../network/error';
import { config } from '../config';
import error from '../network/error';
import { userPermissions } from '../api/components/user/user.fn';

const sign = (data: string) => {
    console.log('data    :>> ', data);
    return jwt.sign(data, config.jwt.secret);
}

const check = {
    permission: async (req: Request, next: NextFunction, idPermission?: number, clientId?: number, grade?: number, admin?: boolean) => {
        const decoded: any = decodeHeader(req, next)
        if (admin) {
            if (decoded.admin) {
                next();
            } else {
                next(error("No tiene los permisos"));
            }
        } else {
            if (!idPermission) {
                next()
            } else if (decoded.admin) {
                next();
            } else if (idPermission && clientId) {
                const permissionsList = await userPermissions(req.body.user.id, clientId, grade || 0);
                const permissionsQuantity = permissionsList.length;
                if (permissionsQuantity < 1) {
                    req.body.statusError = 403
                    next(error("No tiene los permisos"));
                } else {
                    next();
                }
            } else {
                req.body.statusError = 403
                next(error("No tiene los permisos"));
            }
        }
    }
};

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
        const token = getToken(authorization, next)
        const decoded = verify(token)
        req.body.user = decoded
        return decoded
    } catch (error) {
        next(err("Token invalido"))
    }
};

export = {
    sign,
    check
}