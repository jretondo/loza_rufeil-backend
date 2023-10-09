import { Router } from 'express';
import { EModules } from '../../../constant/OTHERS';
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
    .get("/dataTaxProof", secure(undefined, undefined, undefined, true), getTaxProof)
    .get("/dataTax", secure(undefined, undefined, undefined, true), getClientDataTax)
    .get("/:page", secure(undefined, undefined, undefined, true), list)
    .get("/", secure(undefined, undefined, undefined, true), allList)
    .delete("/:id", secure(undefined, undefined, undefined, true), remove)
    .post("/", secure(undefined, undefined, undefined, true), upsert);

export = router;