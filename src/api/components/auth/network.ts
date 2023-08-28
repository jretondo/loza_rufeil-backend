import { Router, NextFunction, Response, Request } from 'express';
import { success } from '../../../network/response';
const router = Router();
import Controller from './index';
import secure from '../../../auth/secure';

const login = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.login(req.body.username, req.body.password)
        .then((userData) => {
            success({ req, res, message: userData })
        })
        .catch(next)
};

const changePass = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert({
        id: req.body.user.id,
        pass: req.body.password,
        prov: 0,
        user: req.body.user.user,
        admin_id: req.body.user.id
    }, "", `${req.body.user.name} ${req.body.user.lastname}`)
        .then(data => {
            success({ res, req, message: data })
        })
        .catch(next)
};

const reqPass = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.recPass(req.body.email)
        .then(response => {
            if (response) {
                success({
                    req,
                    res
                });
            } else {
                next(response);
            }
        })
        .catch(next)
}


router
    .post("/", login)
    .put("/", secure(), changePass)
    .patch("/", reqPass);

export = router