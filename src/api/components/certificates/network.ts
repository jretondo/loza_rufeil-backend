import { EModules } from '../../../constant/OTHERS';
import { NextFunction, Request, Response, Router } from 'express';
import { file, success } from '../../../network/response';
import Controller from './index';
import secure from '../../../auth/secure';
import uploadFile from '../../../middlewares/multer';
import { FILES_ADDRESS } from '../../../constant/FILES_ADDRESS';
const router = Router();

//internal Functions
const upsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert(req.body).then(response => {
        success({ req, res, message: response, status: 201 })
    }).catch(next)
}

const list = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        Number(req.params.page),
        String(req.query.query || "")
    ).then(dataList => {
        success({ req, res, message: dataList })
    }).catch(next)
}

const remove = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.remove(Number(req.params.id)).then(response => {
        success({ req, res, message: response })
    }).catch(next)
}

const createCsr = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.generateCsr(req.body.cuit, req.body.businessName, req.body.certificateName).then((csrData) => {
        file(req, res, csrData.filePath, 'application/x-gzip', csrData.fileName, csrData);
    }).catch(next)
}

const downloadCertificate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.downloadCertificate(parseInt(req.params.id)).then((crtData) => {
        file(req, res, crtData.filePath, 'application/x-gzip', crtData.fileName, crtData);
    }).catch(next)
}

const updateAttribute = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.updateAttribute(req.body.id, req.body.field).then((response) => {
        success({ req, res, message: response })
    }).catch(next)
}

//Routes
router
    .get("/:page", secure(undefined, undefined, EModules.certificates, 1), list)
    .get("/crt-key/:id", secure(undefined, undefined, EModules.certificates, 1), downloadCertificate)
    .delete("/:id", secure(undefined, undefined, EModules.certificates, 3), remove)
    .post("/csr", secure(undefined, undefined, EModules.certificates, 2), createCsr)
    .post("/", secure(undefined, undefined, EModules.certificates, 2), uploadFile(FILES_ADDRESS.certAfip, ["crt_file", "key_file"]), upsert)
    .put("/", secure(undefined, undefined, EModules.certificates, 3), updateAttribute)

export = router;