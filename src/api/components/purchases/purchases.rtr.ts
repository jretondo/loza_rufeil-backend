import { EModules, EPermissions } from './../../../constant/OTHERS';
import { checkClient, checkModule } from './../../../middlewares/secureMiddlewares';
import { Router } from 'express';
import secure from '../../../auth/secure';
import {
    getClientsParams,
    getPaymentsParametersClient,
    insertClientsParams,
    insertPaymentsParametersClient,
    listPurchasePeriods,
    insertPeriod,
    getReceipts,
    upsertReceipt,
    deleteReceipt,
    getReceipt,
    createPurchaseTxt,
    importCVSAfip
} from './purchases.ctrl';
import uploadFile from '../../../middlewares/multer';
import { FILES_ADDRESS } from '../../../constant/FILES_ADDRESS';

const router = Router();

router
    .get("/period", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), listPurchasePeriods)
    .get("/params", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getClientsParams)
    .get("/paymentsMethods", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getPaymentsParametersClient)
    .get("/receipt/:id", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getReceipt)
    .get("/receipts/:page", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getReceipts)
    .get("/receipts/txt/:purchaseId", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), createPurchaseTxt)
    .post("/params", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), insertClientsParams)
    .post("/paymentsMethods", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), insertPaymentsParametersClient)
    .post("/receipt/import", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), uploadFile(FILES_ADDRESS.importsExcel, ["file"]), importCVSAfip)
    .post("/receipt", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), upsertReceipt)
    .post("/period", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), insertPeriod)
    .delete("/receipt/:id", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), deleteReceipt)
    .put("/receipt", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), upsertReceipt)

export default router;