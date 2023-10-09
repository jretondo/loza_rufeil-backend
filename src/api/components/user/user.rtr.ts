import { Router } from 'express';
import { EModules } from '../../../constant/OTHERS';
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
const router = Router();

router
    .get("/details/:id", secure(undefined, undefined, undefined, true), getUser)
    .get("/mydata", secure(), getMyUserData)
    .get("/permissions", secure(undefined, undefined, undefined, true), getUserPermissions)
    .get("/clients", secure(undefined, undefined, undefined, true), getUserClients)
    .get("/:page", secure(undefined, undefined, undefined, true), list)
    .get("/", secure(undefined, undefined, undefined, true), list)
    .post("/clients", secure(undefined, undefined, undefined, true), upsertUserPermissions)
    .post("/", secure(undefined, undefined, undefined, true), upsert)
    .put("/", secure(undefined, undefined, undefined, true), upsert)
    .delete("/:id", secure(undefined, undefined, undefined, true), remove);

export = router;