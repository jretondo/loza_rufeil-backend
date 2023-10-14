import { NextFunction, Request, Response } from 'express';
import auth from './index';
import err from '../network/error';

const checkAuth = () => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            auth.check.permission(req, res, next)
        } catch (error) {
            next(err("No tiene los token envíado"))
        }

    }
    return middleware
}

export = checkAuth