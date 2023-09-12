import { EModules } from '../../../constant/OTHERS';
import { NextFunction, Request, Response, Router } from 'express';
import { success } from '../../../network/response';
import Controller from './index';
import secure from '../../../auth/secure';
const router = Router();

//internal Functions
const periodUpsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.periodUpsert(
        req.body.fromDate,
        req.body.toDate,
        req.body.clientId,
        res, req
    ).then(response => {
        success({ req, res, message: response })
    }).catch(next)
}

const periodList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.periodList(
        Number(req.query.clientId)
    ).then(dataList => {
        success({ req, res, message: dataList })
    }).catch(next)
}

const getAccountList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getAccountList(
        Number(req.query.periodId)
    ).then(dataList => {
        success({ req, res, message: dataList })
    }).catch(next)
}


//Routes
router
    .get("/period", secure(undefined, EModules.accounting, 1), periodList)
    .get("/accountingCharts", secure(undefined, EModules.accounting, 1), getAccountList)
    .post("/period", secure(undefined, EModules.accounting, 2), periodUpsert)

export = router;