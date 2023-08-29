import { EModules } from '../../../constant/OTHERS';
import { NextFunction, Request, Response, Router } from 'express';
import { file, success } from '../../../network/response';
import Controller from './index';
import secure from '../../../auth/secure';
const router = Router();

//internal Functions
const upsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert(req.body).then(response => {
        success({ req, res, message: response })
    }).catch(next)
}

const list = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        req.body.user.admin,
        req.body.user.admin_id,
        Number(req.params.page),
        String(req.query.query || "")
    ).then(dataList => {
        success({ req, res, message: dataList })
    }).catch(next)
}

const allList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.allList(Number(req.body.user.admin_id)).then(dataList => {
        success({ req, res, message: dataList })
    }).catch(next)
}

const remove = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.remove(Number(req.params.id)).then(response => {
        success({ req, res, message: response })
    }).catch(next)
}

const getClientDataTax = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getClientDataTax(Number(req.query.documentNumber)).then(response => {
        success({ req, res, message: response })
    }).catch(next)
}

const getTaxProof = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getTaxProof(Number(req.query.documentNumber), Boolean(req.query.isMono)).then((pdfData) => {
        file(req, res, pdfData.filePath, 'application/pdf', pdfData.fileName, pdfData);
    }).catch(next)
}

//Routes
router
    .get("/dataTaxProof", secure(undefined, EModules.clients, 1), getTaxProof)
    .get("/dataTax", secure(undefined, EModules.clients, 1), getClientDataTax)
    .get("/:page", secure(undefined, EModules.clients, 1), list)
    .get("/", secure(undefined, EModules.clients, 1), allList)
    .delete("/:id", secure(undefined, EModules.clients, 3), remove)
    .post("/", secure(undefined, EModules.clients, 2), upsert);

export = router;