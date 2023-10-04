import { Router } from 'express';
import { EModules } from '../../../constant/OTHERS';
import secure from '../../../auth/secure';
import {
    copyPasteAccountsChart,
    deleteAccountChart,
    getAccountList,
    getNewChildren,
    periodList,
    periodUpsert,
    upsertAccountChart
} from './accounting.ctrl';
const router = Router();

router
    .get("/period", secure(undefined, EModules.accounting, 1), periodList)
    .get("/accountingCharts", secure(undefined, EModules.accounting, 1), getAccountList)
    .get("/accountingChart", secure(undefined, EModules.accounting, 1), getNewChildren)
    .post("/period", secure(undefined, EModules.accounting, 2), periodUpsert)
    .put("/period", secure(undefined, EModules.accounting, 3), copyPasteAccountsChart)
    .post("/accountingChart", secure(undefined, EModules.accounting, 2), upsertAccountChart)
    .delete("/accountingChart/:id", secure(undefined, EModules.accounting, 3), deleteAccountChart)

export = router;