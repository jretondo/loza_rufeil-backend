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
    .get("/dataTaxProof", secure(undefined, EModules.clients, 1), getTaxProof)
    .get("/dataTax", secure(undefined, EModules.clients, 1), getClientDataTax)
    .get("/:page", secure(undefined, EModules.clients, 1), list)
    .get("/", secure(undefined, EModules.clients, 1), allList)
    .delete("/:id", secure(undefined, EModules.clients, 3), remove)
    .post("/", secure(undefined, EModules.clients, 2), upsert);

export = router;