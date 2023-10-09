import { Router } from 'express';
import secure from '../../../auth/secure';
import { getActiveModules, getAllClientsModules } from './modules.ctrl';

const router = Router();

//Routes
router
    .get("/", secure(), getActiveModules)
    .get("/all", secure(), getAllClientsModules)

export = router;