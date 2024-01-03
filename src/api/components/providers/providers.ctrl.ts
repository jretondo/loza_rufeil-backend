import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { IProviders, IProvidersParameters } from '../../../interfaces/Tables';
import IvaCondition from '../../../models/IvaCondition';
import Provider from '../../../models/Providers';
import { file, success } from '../../../network/response';
import { clientDataTax, clientDataTaxPDF } from '../../../utils/afip/dataTax';
import ProviderParameter from '../../../models/ProviderParameter';
import AccountChart from '../../../models/AccountCharts';
import ProviderComprobantes from '../../../models2/Providers';

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
            include: [IvaCondition, {
                model: ProviderParameter,
                include: [{
                    model: AccountChart
                }]
            }],
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
    (async function (accountingPeriodId: number) {
        return await Provider.findAll({
            include: [IvaCondition, {
                model: ProviderParameter,
                where: { accounting_period_id: accountingPeriodId },
                required: false,
            }] })
    })(req.body.periodId).then(data => success({ req, res, message: data })).catch(next)
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

export const insertProviderParameter = async (req: Request, res: Response, next: NextFunction) => {
    (async function (providerParameters: Array<IProvidersParameters>, providerId: number, periodId: number) {
        if (providerParameters.length > 0) {
            const providerParameters: [IProvidersParameters] = req.body.params.map((param: IProvidersParameters) => {
                return {
                    provider_id: providerId,
                    active: param.active,
                    description: param.description,
                    account_chart_id: param.account_chart_id || null,
                    accounting_period_id: periodId,
                }
            })
            await ProviderParameter.destroy({
                where: [{ provider_id: providerId }, { accounting_period_id: periodId }]
            })
            return await ProviderParameter.bulkCreate(providerParameters)
        } else {
            return await ProviderParameter.destroy({ where: [{ provider_id: providerId }, { accounting_period_id: periodId }] })
        }

    })(req.body.params, req.body.providerId, req.body.periodId).then(data => success({ req, res, message: data })).catch(next)
}

export const getProvidersParameters = async (req: Request, res: Response, next: NextFunction) => {
    (async function (providerId: number, accountingPeriodId: number) {
        return await ProviderParameter.findAll({
            where: [{ provider_id: providerId }, { accounting_period_id: accountingPeriodId }],
            include: [AccountChart]
        })
    })(Number(req.query.providerId), Number(req.body.periodId)).then(data => success({ req, res, message: data })).catch(next)
}

export const importProviders = async (req: Request, res: Response, next: NextFunction) => {
    (async function () {
        const providersImport = await ProviderComprobantes.findAll()
        const providersToImport = providersImport.filter((item, index, self) => {
            return index === self.findIndex((t) => (
                t.dataValues.Cuit === item.dataValues.Cuit
            ))
        })
        const dataTaxProvider: IProviders[] = await new Promise(async (resolve, reject) => {
            const providers: any[] = []
            for (let i = 0; i < providersToImport.length; i++) {
                try {
                    const provider = providersToImport[i];
                    const dataTax = await clientDataTax(provider.dataValues.Cuit)
                    const taxes = dataTax.data?.datosRegimenGeneral?.impuesto || []
                    const personType = dataTax.data?.datosGenerales.tipoPersona

                    let ivaConditionId = 0
                    taxes.map(item => {
                        switch (item.idImpuesto) {
                            case 30:
                                ivaConditionId = item.idImpuesto
                                break;
                            case 32:
                                ivaConditionId = item.idImpuesto
                                break;
                            case 20:
                                ivaConditionId = item.idImpuesto
                                break;
                            case 33:
                                ivaConditionId = item.idImpuesto
                                break;
                            case 34:
                                ivaConditionId = item.idImpuesto
                                break;
                            default:
                                break;
                        }
                    })

                    const providerData: IProviders = {
                        business_name: personType === "FISICA" ? dataTax.data?.datosGenerales.apellido + " " + dataTax.data?.datosGenerales.nombre : dataTax.data?.datosGenerales.razonSocial || "",
                        fantasie_name: personType === "FISICA" ? dataTax.data?.datosGenerales.apellido + " " + dataTax.data?.datosGenerales.nombre : dataTax.data?.datosGenerales.razonSocial || "",
                        document_number: String(provider.dataValues.Cuit),
                        iva_condition_id: ivaConditionId,
                        direction: dataTax.data?.datosGenerales.domicilioFiscal.direccion || "",
                        document_type: 80,
                        city: dataTax.data?.datosGenerales.domicilioFiscal.descripcionProvincia + ", " + dataTax.data?.datosGenerales.domicilioFiscal.localidad || "",
                        activity_description: dataTax.data?.datosRegimenGeneral?.actividad ? dataTax.data?.datosRegimenGeneral?.actividad[0]?.descripcionActividad : "" || "",
                    }
                    ivaConditionId > 0 && providers.push(providerData)
                } catch (error) {

                }
            }
            resolve(providers)
        })
        return await Provider.bulkCreate(dataTaxProvider)
    })().then(data => success({ req, res, message: data })).catch(next)
}