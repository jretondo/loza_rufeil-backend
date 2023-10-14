import { NextFunction, Request, Response, Router } from 'express';
import { success } from '../../../network/response';
import secure from '../../../auth/secure';
import { EModules, EPermissions } from '../../../constant/OTHERS';
import { checkAdminAuth, checkClient, checkModule } from '../../../middlewares/secureMiddlewares';
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
    .get("/users", secure(), checkAdminAuth, responseSuccess)
    .get("/clients", secure(), checkAdminAuth, responseSuccess)
    .get("/certificates", secure(), checkAdminAuth, responseSuccess)
    .get("/sells", secure(), checkClient(EPermissions.read), checkModule(EModules.sells), responseSuccess)
    .get("/purchases", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), responseSuccess)
    .get("/accounting", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), responseSuccess)

export = router;