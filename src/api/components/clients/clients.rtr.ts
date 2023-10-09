import { Router } from 'express';
import { EModules } from '../../../constant/OTHERS';
import secure from '../../../auth/secure';
import {
    allList,
    getClientDataTax,
    getTaxProof,
    list,
    remove,
    updatePermissions,
    upsert
} from './clients.ctrl';
const router = Router();

//Routes
router
    .get("/dataTaxProof", secure(), getTaxProof)
    .get("/dataTax", secure(), getClientDataTax)
    .get("/:page", secure(), list)
    .get("/", secure(), allList)
    .delete("/:id", secure(), remove)
    .post("/permissions", secure(), updatePermissions)
    .post("/", secure(), upsert);

export = router;