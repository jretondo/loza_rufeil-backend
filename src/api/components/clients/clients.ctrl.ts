import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { IClients, IClientsModules } from '../../../interfaces/Tables';
import Client from '../../../models/Client';
import IvaCondition from '../../../models/IvaCondition';
import AdminPermission from '../../../models/AdminPermission';
import { file, success } from '../../../network/response';
import { clientDataTax, clientDataTaxPDF } from '../../../utils/afip/dataTax';
import ClientPermission from '../../../models/ClientsPermissions';

export const upsert = async (req: Request, res: Response, next: NextFunction) => {
    (async function (client: IClients) {
        if (client.id) {
            return await Client.update(client, { where: { id: client.id } })
        } else {
            return await Client.create(client)
        }
    })(req.body).then(data => success({ req, res, message: data })).catch(next)
}

export const list = async (req: Request, res: Response, next: NextFunction) => {
    (async function (
        isAdmin: boolean,
        userId: number,
        page: number,
        text?: string
    ) {
        const ITEMS_PER_PAGE = 10;

        const offset = ((page || 1) - 1) * (ITEMS_PER_PAGE);
        const { count, rows } = await Client.findAndCountAll({
            where: {
                [Op.or]: [
                    { business_name: { [Op.substring]: text } },
                    { fantasie_name: { [Op.substring]: text } },
                    { document_number: { [Op.substring]: text } },
                    { email: { [Op.substring]: text } }
                ]
            },
            include: [IvaCondition,
                {
                    model: AdminPermission,
                    where: (!isAdmin ? {
                        [Op.and]: [
                            { permission_grade: { [Op.gte]: 1 } },
                            { admin_id: userId },
                            { client_enabled: true }
                        ]
                    } : {}
                    )
                }],
            offset: offset,
            limit: ITEMS_PER_PAGE
        });
        return {
            totalItems: count,
            itemsPerPage: ITEMS_PER_PAGE,
            items: rows
        }
    })(
        req.body.user.admin,
        req.body.user.admin_id,
        Number(req.params.page),
        String(req.query.query || "")
    ).then(data => success({ req, res, message: data })).catch(next)
}

export const allList = async (req: Request, res: Response, next: NextFunction) => {
    (async function (userId?: number) {
        return await Client.findAll({
            include: [{
                model: AdminPermission,
                where: ((userId) ? [
                    { permission_grade_id: { [Op.gte]: 1 } },
                    { user_id: userId }
                ] : {})
            }]
        })
    })(Number(!req.body.user.admin && req.body.user.admin_id)).then(data => success({ req, res, message: data })).catch(next)
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    (async function (idClient: number) {
        return await Client.destroy({ where: { id: idClient } })
    })(Number(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}

export const getClientDataTax = async (req: Request, res: Response, next: NextFunction) => {
    (async function (documentNumber: number) {
        return await clientDataTax(documentNumber)
    })(Number(req.query.documentNumber)).then(data => success({ req, res, message: data })).catch(next)
}

export const getTaxProof = async (req: Request, res: Response, next: NextFunction) => {
    (async function (documentNumber: number, isMono: boolean) {
        return clientDataTaxPDF(documentNumber, isMono)
    })(Number(req.query.documentNumber), Boolean(req.query.isMono))
        .then((pdfData) => {
            file(req, res, pdfData.filePath, 'application/pdf', pdfData.fileName, pdfData);
        }).catch(next)
}

export const updatePermissions = (req: Request, res: Response, next: NextFunction) => {
    (async function (clientId: number, permissionsArray: [IClientsModules]) {
        await ClientPermission.destroy({ where: { client_id: clientId } })
        const newPermissions: IClientsModules[] = permissionsArray.map(permission => {
            return {
                client_id: clientId,
                module_id: permission.module_id,
                active: permission.active
            }
        })
        const response = await ClientPermission.bulkCreate(newPermissions)
        if (response.length > 0) {
            return response
        } else {
            throw Error("No se pudo actualizar los permisos del cliente")
        }
    })(req.body.clientId, req.body.permissions).then(data => success({ req, res, message: data })).catch(next)
}