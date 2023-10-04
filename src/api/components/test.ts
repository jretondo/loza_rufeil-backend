import { NextFunction, Request, Response, Router } from "express"
import { success } from '../../network/response';
import { config } from '../../config'
const router = Router()

//internal Functions
const test = (req: Request, res: Response, next: NextFunction) => {
    if (config.api.port === "3010") {
        success({ res: res, req: req, status: 200, message: "Bienvenido a la API de testeo" });
    } else {
        success({ res: res, req: req, status: 200, message: "Bienvenido a la API de producción" });
    }
}

//Routes
router.get("/", test)


export = router