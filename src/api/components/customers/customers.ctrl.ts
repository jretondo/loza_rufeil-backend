import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ICostumers, ICustomersParameters } from '../../../interfaces/Tables';
import IvaCondition from '../../../models/IvaCondition';
import Customers from '../../../models/Customers';
import { file, success } from '../../../network/response';
import { clientDataTax, clientDataTaxPDF } from '../../../utils/afip/dataTax';
import CustomerParameter from '../../../models/CustomerParameter';
import AccountChart from '../../../models/AccountCharts';

export const upsert = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (client: ICostumers) {
    if (client.id) {
      return await Customers.update(client, { where: { id: client.id } });
    } else {
      return await Customers.create(client);
    }
  })(req.body)
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  (async function (page: number, text?: string) {
    const ITEMS_PER_PAGE = 10;

    const offset = ((page || 1) - 1) * ITEMS_PER_PAGE;
    const { count, rows } = await Customers.findAndCountAll({
      where: {
        [Op.or]: [
          { business_name: { [Op.substring]: text } },
          { fantasie_name: { [Op.substring]: text } },
          { document_number: { [Op.substring]: text } },
        ],
      },
      include: [
        IvaCondition,
        {
          model: CustomerParameter,
          include: [
            {
              model: AccountChart,
            },
          ],
        },
      ],
      offset: offset,
      limit: ITEMS_PER_PAGE,
    });
    return {
      totalItems: count,
      itemsPerPage: ITEMS_PER_PAGE,
      items: rows,
    };
  })(Number(req.params.page), String(req.query.query || ''))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const allList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accountingPeriodId: number) {
    return await Customers.findAll({
      include: [
        IvaCondition,
        {
          model: CustomerParameter,
          where: { accounting_period_id: accountingPeriodId },
          required: false,
        },
      ],
    });
  })(req.body.periodId)
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (idClient: number) {
    return await Customers.destroy({ where: { id: idClient } });
  })(Number(req.params.id))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getClientDataTax = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (documentNumber: number) {
    return await clientDataTax(documentNumber);
  })(Number(req.query.documentNumber))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getTaxProof = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (documentNumber: number, isMono: boolean) {
    return clientDataTaxPDF(documentNumber, isMono);
  })(Number(req.query.documentNumber), Boolean(req.query.isMono))
    .then((pdfData) => {
      file(
        req,
        res,
        pdfData.filePath,
        'application/pdf',
        pdfData.fileName,
        pdfData,
      );
    })
    .catch(next);
};

export const insertProviderParameter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    providerParameters: Array<ICustomersParameters>,
    providerId: number,
    periodId: number,
  ) {
    if (providerParameters.length > 0) {
      const providerParameters: [ICustomersParameters] = req.body.params.map(
        (param: ICustomersParameters) => {
          return {
            customer_id: providerId,
            active: param.active,
            description: param.description,
            account_chart_id: param.account_chart_id || null,
            accounting_period_id: periodId,
          };
        },
      );
      await CustomerParameter.destroy({
        where: [
          { customer_id: providerId },
          { accounting_period_id: periodId },
        ],
      });
      return await CustomerParameter.bulkCreate(providerParameters);
    } else {
      return await CustomerParameter.destroy({
        where: [
          { customer_id: providerId },
          { accounting_period_id: periodId },
        ],
      });
    }
  })(req.body.params, req.body.providerId, req.body.periodId)
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getProvidersParameters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (providerId: number, accountingPeriodId: number) {
    return await CustomerParameter.findAll({
      where: [
        { customer_id: providerId },
        { accounting_period_id: accountingPeriodId },
      ],
      include: [AccountChart],
    });
  })(Number(req.query.providerId), Number(req.body.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};
