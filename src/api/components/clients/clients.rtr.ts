import { Router } from 'express';
import secure from '../../../auth/secure';
import {
    allList,
    clientTokenGenerator,
    getClientDataTax,
    getTaxProof,
    list,
    remove,
    updatePermissions,
    upsert
} from './clients.ctrl';
import { checkAdminAuth } from '../../../middlewares/secureMiddlewares';
const router = Router();

//Routes
router
    .get("/dataTaxProof", secure(), checkAdminAuth, getTaxProof)
    .get("/dataTax", secure(), checkAdminAuth, getClientDataTax)
    .get("/token", secure(), clientTokenGenerator)
    .get("/:page", secure(), list)
    .get("/", secure(), allList)
    .delete("/:id", secure(), checkAdminAuth, remove)
    .post("/permissions", secure(), checkAdminAuth, updatePermissions)
    .post("/", secure(), checkAdminAuth, upsert);

export = router;