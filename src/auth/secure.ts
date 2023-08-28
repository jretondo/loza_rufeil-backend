import { NextFunction, Request, Response } from 'express';
import auth from './index';

const checkAuth = (idPermission?: number, clientId?: number, moduleId?: number, grade?: number) => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            auth.check.permission(req, next, idPermission, clientId, moduleId, grade)
        } catch (error) {

        }
    }
    return middleware
}

export = checkAuth