import { NextFunction, Request, Response } from 'express';
import auth from './index';

const checkAuth = (idPermission?: number, clientId?: number, grade?: number) => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            auth.check.permission(req, next, idPermission, clientId, grade)
        } catch (error) {

        }
    }
    return middleware
}

export = checkAuth