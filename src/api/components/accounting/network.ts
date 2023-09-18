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
        Number(req.query.periodId),
        String(req.query.contain ? req.query.contain : "")
    ).then(dataList => {
        success({ req, res, message: dataList })
    }).catch(next)
}

const getNewChildren = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getNewChildren(Number(req.query.accountId))
        .then(dataList => {
            success({ req, res, message: dataList })
        }).catch(next)
}

const upsertAccountChart = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsertAccountChart(req.body.formData)
        .then(dataList => {
            success({ req, res, message: dataList })
        }).catch(next)
}

const deleteAccountChart = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.deleteAccountChart(Number(req.params.id))
        .then(dataList => {
            success({ req, res, message: dataList })
        }).catch(next)
}

const copyPasteAccountsChart = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.copyPasteAccountsChart(
        Number(req.body.original_period_id),
        Number(req.body.copy_period_id))
        .then(dataList => {
            success({ req, res, message: dataList })
        }).catch(next)
}

//Routes
router
    .get("/period", secure(undefined, EModules.accounting, 1), periodList)
    .get("/accountingCharts", secure(undefined, EModules.accounting, 1), getAccountList)
    .get("/accountingChart", secure(undefined, EModules.accounting, 1), getNewChildren)
    .post("/period", secure(undefined, EModules.accounting, 2), periodUpsert)
    .put("/period", secure(undefined, EModules.accounting, 3), copyPasteAccountsChart)
    .post("/accountingChart", secure(undefined, EModules.accounting, 2), upsertAccountChart)
    .delete("/accountingChart/:id", secure(undefined, EModules.accounting, 3), deleteAccountChart)

export = router;