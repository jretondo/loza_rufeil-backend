import { Router } from 'express';
import { EModules, EPermissions } from '../../../constant/OTHERS';
import secure from '../../../auth/secure';
import {
    allowImport,
    copyPasteAccountsChart,
    deleteAccountChart,
    getAccountList,
    getAttributableAccounts,
    getNewChildren,
    periodList,
    periodUpsert,
    upsertAccountChart
} from './accounting.ctrl';
import { checkClient, checkModule } from '../../../middlewares/secureMiddlewares';
const router = Router();

router
    .get("/period", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), periodList)
    .get("/allowImport", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), allowImport)
    .get("/accountingCharts", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getAccountList)
    .get("/accountingChart", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getNewChildren)
    .get("/attributableAccountingChart", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getAttributableAccounts)
    .post("/period", secure(), checkClient(EPermissions.write), periodUpsert)
    .put("/period", secure(), checkClient(EPermissions.update), checkModule(EModules.accounting), copyPasteAccountsChart)
    .post("/accountingChart", secure(), checkClient(EPermissions.write), checkModule(EModules.accounting), upsertAccountChart)
    .delete("/accountingChart/:id", secure(), checkClient(EPermissions.totalControl), checkModule(EModules.accounting), deleteAccountChart)

export = router;