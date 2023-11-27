import { Request, NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import err from '../network/error';
import { config } from '../config';
import Admin from '../models/Admin';

const sign = (data: string) => {
    return jwt.sign(data, config.jwt.secret);
}

const check = {
    permission: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const decoded: any = decodeHeader(req, next)
            const userId: number = decoded.id
            const userData = await Admin.findByPk(userId)
            if (userData) {
                req.body.user = decoded
                next()
            } else {
                next(err("No tiene los token envíado"))
            }
        } catch (error) {
            next(err("No tiene los token envíado"))
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
        const userAuth = authorization.split("||")[0]
        const token = getToken(userAuth, next)
        const decoded = verify(token)
        return decoded
    } catch (error) {
        next(err("Token invalido"))
    }
};

export = {
    sign,
    check
}