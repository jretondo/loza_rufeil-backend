import { Router } from 'express';
import secure from '../../../auth/secure';
import {
    getMyUserData,
    getUser,
    getUserClients,
    getUserPermissions,
    list,
    remove,
    upsert,
    upsertUserPermissions
} from './user.ctrl';
import { checkAdminAuth } from '../../../middlewares/secureMiddlewares';
const router = Router();

router
    .get("/details/:id", secure(), checkAdminAuth, getUser)
    .get("/mydata", secure(), getMyUserData)
    .get("/permissions", secure(), checkAdminAuth, getUserPermissions)
    .get("/clients", secure(), checkAdminAuth, getUserClients)
    .get("/:page", secure(), checkAdminAuth, list)
    .get("/", secure(), checkAdminAuth, list)
    .post("/clients", secure(), checkAdminAuth, upsertUserPermissions)
    .post("/", secure(), checkAdminAuth, upsert)
    .put("/", secure(), checkAdminAuth, upsert)
    .delete("/:id", secure(), checkAdminAuth, remove);

export = router;