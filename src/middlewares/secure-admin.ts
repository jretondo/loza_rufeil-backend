import { NextFunction, Request, Response } from "express";
import err from "../network/error";

export const checkAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.user.admin) {
        next();
    } else {
        next(err("No es un administrador del sistema!"));
    }
}