import { EModules } from '../../../constant/OTHERS';
import { Router, NextFunction, Response, Request } from 'express';
import { success } from '../../../network/response';
const router = Router();
import Controller from './index';
import secure from '../../../auth/secure';

const list = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(undefined, req.body.query)
        .then((list: any) => {
            success({
                req,
                res,
                status: 200,
                message: list
            });
        })
        .catch(next)
};

const listPagination = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        Number(req.params.page),
        String(req.query.query ? req.query.query : ""),
        Number(req.query.cantPerPage)
    )
        .then((list: any) => {
            success({
                req,
                res,
                status: 200,
                message: list
            });
        })
        .catch(next)
};

const upsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert(req.body)
        .then(response => {
            if (response) {
                success({
                    req,
                    res,
                    status: 201
                });
            } else {
                next(response);
            }
        })
        .catch(next)
}

const remove = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.remove(Number(req.params.id))
        .then(() => {
            success({ req, res });
        })
        .catch(next)
}

const get = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getUser(Number(req.params.id))
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
}

const myDataUser = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getUser(req.body.user.admin_id)
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
}

const getUserClientsPermissions = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getPermissionsUser(Number(req.query.idUser))
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
}

const upsertUserPermissions = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsertUserPermissions(req.body.idUser, req.body.permissionsList)
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
}

const upsertUserModulesPermissions = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsertUserModulesPermissions(req.body.idUser, req.body.permissionsList)
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
}

const getPermissionsUserModules = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getPermissionsUserModules(Number(req.query.idUser))
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
}

router
    .get("/details/:id", secure(undefined, undefined, EModules.users, 1), get)
    .get("/mydata", secure(), myDataUser)
    .get("/permissions", secure(undefined, undefined, EModules.users, 1), getUserClientsPermissions)
    .get("/modulesPermissions", secure(undefined, undefined, EModules.users, 1), getPermissionsUserModules)
    .get("/:page", secure(undefined, undefined, EModules.users, 1), listPagination)
    .get("/", secure(undefined, undefined, EModules.users, 1), list)
    .post("/permissions", secure(undefined, undefined, EModules.users, 2), upsertUserPermissions)
    .post("/modulesPermissions", secure(undefined, undefined, EModules.users, 2), upsertUserModulesPermissions)
    .post("/", secure(undefined, undefined, EModules.users, 2), upsert)
    .put("/", secure(undefined, undefined, EModules.users, 3), upsert)
    .delete("/:id", secure(undefined, undefined, EModules.users, 3), remove);

export = router;