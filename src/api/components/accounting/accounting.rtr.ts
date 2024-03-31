import { Router } from 'express';
import { EModules, EPermissions } from '../../../constant/OTHERS';
import secure from '../../../auth/secure';
import {
    allowImport,
    copyPasteAccountsChart,
    deleteAccountChart,
    getAccountList,
    getAccountingEntries,
    getAttributableAccounts,
    getJournalList,
    getNewChildren,
    lastEntryData,
    newAccountingEntry,
    periodList,
    periodUpsert,
    updateAccountingEntry,
    upsertAccountChart
} from './accounting.ctrl';
import { checkClient, checkModule } from '../../../middlewares/secureMiddlewares';
const router = Router();

router
    .get("/period", secure(), checkClient(EPermissions.read), periodList)
    .get("/allowImport", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), allowImport)
    .get("/entries/:page", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getAccountingEntries)
    .get("/journal/:page", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getJournalList)
    .get("/lastEntryData", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), lastEntryData)
    .get("/accountingCharts", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getAccountList)
    .get("/accountingChart", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getNewChildren)
    .get("/attributableAccountingChart", secure(), checkClient(EPermissions.read), checkModule(EModules.accounting), getAttributableAccounts)
    .post("/period", secure(), checkClient(EPermissions.write), periodUpsert)
    .put("/period", secure(), checkClient(EPermissions.update), checkModule(EModules.accounting), copyPasteAccountsChart)
    .put("/accountingEntry", secure(), checkClient(EPermissions.write), checkModule(EModules.accounting), updateAccountingEntry)
    .post("/accountingEntry", secure(), checkClient(EPermissions.write), checkModule(EModules.accounting), newAccountingEntry)
    .post("/accountingChart", secure(), checkClient(EPermissions.write), checkModule(EModules.accounting), upsertAccountChart)
    .delete("/accountingChart/:id", secure(), checkClient(EPermissions.totalControl), checkModule(EModules.accounting), deleteAccountChart)

export = router;