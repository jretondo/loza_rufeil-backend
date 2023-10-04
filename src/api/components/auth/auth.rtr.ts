import { Router } from 'express';
const router = Router();
import secure from '../../../auth/secure';
import { changePass, login, recPass } from './auth.ctrl';

router
    .post("/", login)
    .put("/", secure(), changePass)
    .patch("/", recPass);

export = router