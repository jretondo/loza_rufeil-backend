import { checkAdminAuth } from '../../../middlewares/secureMiddlewares';
import { Router } from 'express';
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
    .get("/:page", secure(), checkAdminAuth, list)
    .get("/crt-key/:id", secure(), checkAdminAuth, downloadCertificate)
    .delete("/:id", secure(), checkAdminAuth, remove)
    .post("/csr", secure(), checkAdminAuth, generateCsr)
    .post("/", secure(), checkAdminAuth, uploadFile(FILES_ADDRESS.certAfip, ["crt_file", "key_file"]), upsert)
    .put("/", secure(), checkAdminAuth, updateAttribute)

export = router;