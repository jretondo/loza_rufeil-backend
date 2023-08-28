import { error } from './response';
import { ErrorRequestHandler } from 'express';

export const errorThrow: ErrorRequestHandler = (err, req, res, next) => {
    console.error('[error]', err);
    try {
        const status = req.body.statusError;
        error({
            req: req,
            res: res,
            status: status,
            message: err.message
        });
    } catch (e) {
        error({
            req: req,
            res: res,
            status: 500,
            message: err.message
        });
    }
}