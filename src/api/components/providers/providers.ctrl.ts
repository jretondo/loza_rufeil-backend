import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { IProviders } from '../../../interfaces/Tables';
import IvaCondition from '../../../models/IvaCondition';
import Provider from '../../../models/Providers';
import { file, success } from '../../../network/response';
import { clientDataTax, clientDataTaxPDF } from '../../../utils/afip/dataTax';


export const upsert = async (req: Request, res: Response, next: NextFunction) => {
    (async function (client: IProviders) {
        if (client.id) {
            return await Provider.update(client, { where: { id: client.id } })
        } else {
            return await Provider.create(client)
        }
    })(req.body).then(data => success({ req, res, message: data })).catch(next)
}

export const list = async (req: Request, res: Response, next: NextFunction) => {
    (async function (page: number, text?: string) {
        const ITEMS_PER_PAGE = 10;

        const offset = ((page || 1) - 1) * (ITEMS_PER_PAGE);
        const { count, rows } = await Provider.findAndCountAll({
            where: {
                [Op.or]: [
                    { business_name: { [Op.substring]: text } },
                    { fantasie_name: { [Op.substring]: text } },
                    { document_number: { [Op.substring]: text } }
                ]
            },
            include: [IvaCondition],
            offset: offset,
            limit: ITEMS_PER_PAGE
        });
        return {
            totalItems: count,
            itemsPerPage: ITEMS_PER_PAGE,
            items: rows
        }
    })(Number(req.params.page), String(req.query.query || "")).then(data => success({ req, res, message: data })).catch(next)
}

export const allList = async (req: Request, res: Response, next: NextFunction) => {
    (async function () {
        return await Provider.findAll()
    })().then(data => success({ req, res, message: data })).catch(next)
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    (async function (idClient: number) {
        return await Provider.destroy({ where: { id: idClient } })
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