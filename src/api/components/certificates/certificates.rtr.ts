import { Router } from 'express';
import { EModules } from '../../../constant/OTHERS';
import secure from '../../../auth/secure';
import uploadFile from '../../../middlewares/multer';
import { FILES_ADDRESS } from '../../../constant/FILES_ADDRESS';
import {
    downloadCertificate,
    generateCsr,
    list,
    remove,
    updateAttribute,
    upsert
} from './certificates.ctrl';
const router = Router();

router
    .get("/:page", secure(undefined, undefined, undefined, true), list)
    .get("/crt-key/:id", secure(undefined, undefined, undefined, true), downloadCertificate)
    .delete("/:id", secure(undefined, undefined, undefined, true), remove)
    .post("/csr", secure(undefined, undefined, undefined, true), generateCsr)
    .post("/", secure(undefined, undefined, undefined, true), uploadFile(FILES_ADDRESS.certAfip, ["crt_file", "key_file"]), upsert)
    .put("/", secure(undefined, undefined, undefined, true), updateAttribute)

export = router;