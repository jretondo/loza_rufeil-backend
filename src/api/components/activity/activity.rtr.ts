import { Router } from 'express';
import secure from '../../../auth/secure';
import { list, upsert } from './activity.ctrl';
import { checkAdminAuth } from '../../../middlewares/secureMiddlewares';

const router = Router();

router
    .get("/:page", secure(), checkAdminAuth, list)
    .post("/", secure(), upsert);

export = router;