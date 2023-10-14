import { EModules, EPermissions } from './../../../constant/OTHERS';
import { checkClient, checkModule } from './../../../middlewares/secureMiddlewares';
import { Router } from 'express';
import secure from '../../../auth/secure';
import { getClientsParams, getPaymentsParametersClient, insertClientsParams, insertPaymentsParametersClient, listPurchasePeriods, upsertPurchasePeriod } from './purchases.ctrl';

const router = Router();

router
    .get("/period", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), listPurchasePeriods)
    .get("/params", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getClientsParams)
    .get("/paymentsMethods", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getPaymentsParametersClient)
    .post("/period", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), upsertPurchasePeriod)
    .post("/params", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), insertClientsParams)
    .post("/paymentsMethods", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), insertPaymentsParametersClient)

export default router;