import { EModules, EPermissions } from './../../../constant/OTHERS';
import { checkClient, checkModule } from './../../../middlewares/secureMiddlewares';
import { Router } from 'express';
import secure from '../../../auth/secure';
import {
    allList,
    getClientDataTax,
    getTaxProof,
    list,
    remove,
    upsert
} from './providers.ctrl';
const router = Router();

//Routes
router
    .get("/dataTaxProof", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getTaxProof)
    .get("/dataTax", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), getClientDataTax)
    .get("/:page", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), list)
    .get("/", secure(), checkClient(EPermissions.read), checkModule(EModules.purchases), allList)
    .delete("/:id", secure(), checkClient(EPermissions.totalControl), checkModule(EModules.purchases), remove)
    .post("/", secure(), checkClient(EPermissions.write), checkModule(EModules.purchases), upsert);

export = router;