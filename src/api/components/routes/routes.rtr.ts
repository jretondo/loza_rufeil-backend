import { NextFunction, Request, Response, Router } from 'express';
import { success } from '../../../network/response';
import secure from '../../../auth/secure';
import { EModules } from '../../../constant/OTHERS';
const router = Router();

const responseSuccess = (req: Request, res: Response, next: NextFunction) => {
    try {
        success({ req, res });
    } catch (error) {
        next(error);
    }
}

//Routes
router
    .get("/dashboard", secure(), responseSuccess)
    .get("/users", secure(), responseSuccess)
    .get("/clients", secure(undefined, undefined, undefined, true), responseSuccess)
    .get("/certificates", secure(undefined, undefined, undefined, true), responseSuccess)
    .get("/sells", secure(undefined, EModules.sells, 1), responseSuccess)
    .get("/purchases", secure(undefined, EModules.purchases, 1), responseSuccess)
    .get("/accounting", secure(undefined, EModules.accounting, 1), responseSuccess)

export = router;