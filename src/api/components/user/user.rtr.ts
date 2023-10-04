import { Router } from 'express';
import { EModules } from '../../../constant/OTHERS';
import secure from '../../../auth/secure';
import {
    getModules,
    getMyUserData,
    getUser,
    getUserPermissions,
    list,
    remove,
    upsert,
    upsertUserPermissions
} from './user.ctrl';
const router = Router();

router
    .get("/details/:id", secure(undefined, EModules.users, 1), getUser)
    .get("/mydata", secure(), getMyUserData)
    .get("/permissions", secure(undefined, EModules.users, 1), getUserPermissions)
    .get("/modules", secure(), getModules)
    .get("/:page", secure(undefined, EModules.users, 1), list)
    .get("/", secure(undefined, EModules.users, 1), list)
    .post("/permissions", secure(undefined, EModules.users, 2), upsertUserPermissions)
    .post("/", secure(undefined, EModules.users, 2), upsert)
    .put("/", secure(undefined, EModules.users, 3), upsert)
    .delete("/:id", secure(undefined, EModules.users, 3), remove);

export = router;