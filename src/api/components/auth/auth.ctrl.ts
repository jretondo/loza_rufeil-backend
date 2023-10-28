import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import AuthAdmin from '../../../models/AuthAdmin';
import { passCreator } from '../../../utils/functions/passCreator';
import { sendPass } from '../../../utils/sendEmails/sendPass';
import auth from '../../../auth';
import { IAuth } from '../../../interfaces/Tables';
import Admin from '../../../models/Admin';
import { success } from '../../../network/response';

export const authUpsert = async (body: IAuth, email: string, name: string) => {
    let newAuth: IAuth;
    if (body.pass) {
        newAuth = {
            user: body.user,
            prov: body.prov,
            pass: await bcrypt.hash(body.pass, 5),
            admin_id: body.admin_id
        };
        return await AuthAdmin.update(newAuth, { where: { admin_id: body.admin_id } });
    } else {
        const newPass = await passCreator();
        newAuth = {
            id: body.id,
            user: body.user,
            prov: 1,
            pass: await bcrypt.hash(newPass, 5),
            admin_id: body.id || 0
        };
        const result = await AuthAdmin.create(newAuth);
        if (result.dataValues.id) {
            return await sendPass(body.user, name, newPass, email, "Nuevo usuario", true, false);
        } else {
            return false;
        }
    }
}

export const changePass = async (req: Request, res: Response, next: NextFunction) => {
    (async function (req: Request) {
        const { body } = req;
        const data = {
            id: body.user.id,
            pass: body.password,
            prov: 0,
            user: body.user.user,
            admin_id: body.user.id
        }
        await authUpsert(data, "", `${req.body.user.name} ${req.body.user.lastname}`);
    })(req).then(data => success({ req, res, message: data })).catch(next)
}

export const recPass = async (req: Request, res: Response, next: NextFunction) => {
    (async function (email: string) {
        const newPass = await passCreator();
        const userData = await Admin.findOne({ where: { email: email } });
        const idUsu = userData?.dataValues.id || 0;
        const user = userData?.dataValues.user || "";
        const data: IAuth = {
            user: user,
            prov: 1,
            pass: newPass,
            admin_id: idUsu || 0
        };
        await sendPass(userData?.dataValues.user || "", `${userData?.dataValues.name} ${userData?.dataValues.lastname}`, newPass, email, "Recuperar Contraseña", false, false);
        return await authUpsert(data, email, `${userData?.dataValues.name} ${userData?.dataValues.lastname}`);
    })(req.body.email).then(data => success({ req, res, message: data })).catch(next)
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    (async function (username: string, password: string) {
        const data3 = await AuthAdmin.findAll({ where: { user: username } });
        const data2 = await Admin.findAll({ where: { user: username } });

        const userData = data2[0]
        const data = {
            ...data2[0].dataValues,
            ...data3[0].dataValues
        }
        const prov = data.prov
        return bcrypt.compare(password, data.pass || "")
            .then(same => {
                if (same) {
                    return {
                        token: auth.sign(JSON.stringify(data)),
                        userData: userData,
                        provisory: prov,
                    }
                } else {
                    throw new Error('información invalida')
                }
            })
    })(req.body.username, req.body.password).then(data => success({ req, res, message: data })).catch(next)
}