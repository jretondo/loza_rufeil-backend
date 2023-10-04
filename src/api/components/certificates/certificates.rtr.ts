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
    .get("/:page", secure(undefined, EModules.certificates, 1), list)
    .get("/crt-key/:id", secure(undefined, EModules.certificates, 1), downloadCertificate)
    .delete("/:id", secure(undefined, EModules.certificates, 3), remove)
    .post("/csr", secure(undefined, EModules.certificates, 2), generateCsr)
    .post("/", secure(undefined, EModules.certificates, 2), uploadFile(FILES_ADDRESS.certAfip, ["crt_file", "key_file"]), upsert)
    .put("/", secure(undefined, EModules.certificates, 3), updateAttribute)

export = router;