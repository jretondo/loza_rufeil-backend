import { Router } from 'express';
import { EModules } from '../../../constant/OTHERS';
import secure from '../../../auth/secure';
import { list, upsert } from './activity.ctrl';

const router = Router();

router
    .get("/:page", secure(undefined, EModules.users, 1), list)
    .post("/", secure(), upsert);

export = router;