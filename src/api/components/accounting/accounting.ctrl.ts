import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { Op, Sequelize, WhereOptions, col, fn, literal } from 'sequelize';
import {
  IAccountCharts,
  IAccountingEntries,
  IAccountingPeriod,
} from '../../../interfaces/Tables';
import AccountingPeriod from '../../../models/AccountingPeriod';
import { error, file, success } from '../../../network/response';
import { Columns } from '../../../constant/TABLES';
import AccountChart from '../../../models/AccountCharts';
import { IAccountChartsToFront } from '../../../interfaces/Others';
import { accountControl } from '../../../utils/classes/AccountControl';
import {
  accountChartItem,
  accountListExcel,
  checkDetails,
  getUpdateAttributes,
  newDefaultAccountCharts,
  nextChildrenAccount,
  periodListFn,
} from './accounting.fn';
import AccountingEntries from '../../../models/AccountingEntry';
import AccountingEntriesDetails from '../../../models/AccountingEntryDetail';
import Client from '../../../models/Client';
import moment from 'moment';
import PurchasePeriod from '../../../models/PurchasePeriod';
import { pdfGenerator } from '../../../utils/reports/chrome-pdf';

export const periodUpsert = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (fromDate: Date, toDate: Date, clientId: number) {
    const periods = await periodListFn(clientId, fromDate, toDate);
    const newPeriod: IAccountingPeriod = {
      from_date: fromDate,
      to_date: toDate,
      client_id: clientId,
      closed: false,
    };
    if (periods.length > 0) {
      throw error({
        status: 403,
        message: 'El nuevo ejercicio no puede pisar uno ya cargado!',
        req,
        res,
      });
    }
    const result = await AccountingPeriod.create(newPeriod);
    return newDefaultAccountCharts(result.dataValues.id || 0);
  })(req.body.fromDate, req.body.toDate, req.body.clientId)
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const periodList = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Array<AccountingPeriod> | any> => {
  (async function (clientId: number, fromDate?: Date, toDate?: Date) {
    return periodListFn(clientId, fromDate, toDate);
  })(Number(req.query.clientId), req.body.fromDate, req.body.toDate)
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getAccountList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accountPeriodId: number, contain?: string) {
    const accountingList = await AccountChart.findAll({
      where: [
        { accounting_period_id: accountPeriodId },
        { name: { [Op.like]: `%${contain}%` } },
      ],
      order: [
        [`${Columns.accountCharts.genre}`, 'ASC'],
        [`${Columns.accountCharts.group}`, 'ASC'],
        [`${Columns.accountCharts.caption}`, 'ASC'],
        [`${Columns.accountCharts.account}`, 'ASC'],
        [`${Columns.accountCharts.sub_account}`, 'ASC'],
      ],
    });

    const control = new accountControl();

    let list: Array<IAccountChartsToFront> = [];

    accountingList.map((account) => {
      if (control.last.genre < account.dataValues.genre) {
        list.push(accountChartItem(account.dataValues, true));
        control.lastGenre(account.dataValues.genre);
        control.addCountGenre();
      } else if (control.last.group < account.dataValues.group) {
        list[control.count.genre - 1].subAccounts.push(
          accountChartItem(account.dataValues, false),
        );
        control.lastGroup(account.dataValues.group);
        control.addCountGroup();
      } else if (control.last.caption < account.dataValues.caption) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts.push(accountChartItem(account.dataValues, false));
        control.lastCaption(account.dataValues.caption);
        control.addCountCaption();
      } else if (control.last.account < account.dataValues.account) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts[control.count.caption - 1].subAccounts.push(
          accountChartItem(account.dataValues, false),
        );
        control.lastAccount(account.dataValues.account);
        control.addCountAccount();
      } else if (control.last.subAccount < account.dataValues.sub_account) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts[control.count.caption - 1].subAccounts[
          control.count.account - 1
        ].subAccounts.push(accountChartItem(account.dataValues, false));
        control.lastSubAccount(account.dataValues.sub_account);
        control.addCountSubAccount();
      }
    });
    return list;
  })(
    Number(req.body.periodId),
    String(req.query.contain ? req.query.contain : ''),
  )
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const upsertAccountChart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (account: IAccountCharts) {
    if (account.id) {
      return await AccountChart.update(account, { where: { id: account.id } });
    } else {
      return await AccountChart.create(account);
    }
  })(req.body.formData)
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const deleteAccountChart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accountId: number) {
    const account = await AccountChart.findOne({ where: { id: accountId } });
    if (account) {
      if (account?.dataValues.sub_account > 0) {
        return await AccountChart.destroy({ where: { id: accountId } });
      } else if (account?.dataValues.account > 0) {
        const account = await AccountChart.findOne({
          where: { id: accountId },
        });
        return await AccountChart.destroy({
          where: [
            { genre: account?.dataValues.genre },
            { group: account?.dataValues.group },
            { caption: account?.dataValues.caption },
            { account: account?.dataValues.account },
          ],
        });
      } else if (account?.dataValues.caption > 0) {
        const account = await AccountChart.findOne({
          where: { id: accountId },
        });
        return await AccountChart.destroy({
          where: [
            { genre: account?.dataValues.genre },
            { group: account?.dataValues.group },
            { caption: account?.dataValues.caption },
          ],
        });
      } else if (account?.dataValues.group > 0) {
        const account = await AccountChart.findOne({
          where: { id: accountId },
        });
        return await AccountChart.destroy({
          where: [
            { genre: account?.dataValues.genre },
            { group: account?.dataValues.group },
          ],
        });
      }
    }
  })(Number(req.params.id))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const copyPasteAccountsChart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (original_period_id: number, copy_period_id: number) {
    const responseDelete = await AccountChart.destroy({
      where: { accounting_period_id: original_period_id },
    });
    if (responseDelete > 0) {
      const copyAccounts = await AccountChart.findAll({
        attributes: {
          include: [
            [
              Sequelize.literal(`${original_period_id}`),
              `${Columns.accountCharts.accounting_period_id}`,
            ],
          ],
          exclude: [`${Columns.accountCharts.id}`],
        },
        where: { accounting_period_id: copy_period_id },
      });
      return await AccountChart.bulkCreate(
        copyAccounts.map((account) => account.dataValues),
      );
    } else {
      throw Error(
        'No se pudo eliminar la cuenta original. Posiblemente haya movimientos asociados a esas cuentas.',
      );
    }
  })(Number(req.body.original_period_id), Number(req.body.copy_period_id))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getNewChildren = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accountId: number) {
    const accountData = await AccountChart.findOne({
      where: { id: accountId },
    });
    return await nextChildrenAccount(accountData);
  })(Number(req.body.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getAttributableAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accountPeriodId: number) {
    return await AccountChart.findAll({
      where: [
        { accounting_period_id: accountPeriodId },
        { attributable: true },
      ],
      order: [[`${Columns.accountCharts.code}`, 'ASC']],
    });
  })(Number(req.body.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const allowImport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accounting_period_id: number) {
    const accountsCount = await AccountChart.count({
      where: { accounting_period_id },
    });

    if (accountsCount > 5) {
      return 0;
    } else {
      return 1;
    }
  })(Number(req.query.accountingId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const lastEntryData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accounting_period_id: number, entryNumber?: number) {
    const lastEntry = await AccountingEntries.findOne({
      attributes: [
        [
          Sequelize.fn(
            'MAX',
            Sequelize.col(`${Columns.accountingEntries.number}`),
          ),
          'lastEntry',
        ],
      ],
      where: { accounting_period_id },
    });
    const accountingPeriod = await AccountingPeriod.findOne({
      where: { id: accounting_period_id },
    });
    let lastDate;
    let firstDate;
    if (entryNumber) {
      lastDate = await AccountingEntries.findOne({
        attributes: [
          [
            Sequelize.fn(
              'MAX',
              Sequelize.col(`${Columns.accountingEntries.date}`),
            ),
            'lastDate',
          ],
        ],
        where: [{ accounting_period_id }, { number: { [Op.gt]: entryNumber } }],
      }).then((data) => data?.dataValues.lastDate);

      firstDate = await AccountingEntries.findOne({
        attributes: [
          [
            Sequelize.fn(
              'MIN',
              Sequelize.col(`${Columns.accountingEntries.date}`),
            ),
            'firstDate',
          ],
        ],
        where: [{ accounting_period_id }, { number: { [Op.lt]: entryNumber } }],
      }).then((data) => data?.dataValues.firstDate);
    } else {
      lastDate = accountingPeriod?.dataValues.to_date;

      firstDate = await AccountingEntries.findOne({
        attributes: [
          [
            Sequelize.fn(
              'MAX',
              Sequelize.col(`${Columns.accountingEntries.date}`),
            ),
            'firstDate',
          ],
        ],
        where: [{ accounting_period_id }],
      }).then((data) => data?.dataValues.firstDate);
    }

    return {
      lastNumber: (lastEntry?.dataValues.lastEntry || 0) + 1,
      minLimitDate: firstDate || accountingPeriod?.dataValues.from_date,
      maxLimitDate: lastDate || accountingPeriod?.dataValues.to_date,
    };
  })(Number(req.body.periodId), Number(req.query.entryNumber))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const newAccountingEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    accountingEntry: IAccountingEntries,
    accounting_period_id: number,
    purchasePeriodId: number,
    sellsPeriodId: number,
  ) {
    if (!(await checkDetails(accountingEntry, accounting_period_id))) {
      throw Error('La entrada contable no está balanceada.');
    }

    const { date, description, debit, credit, number } = accountingEntry;
    const accountingEntryData = await AccountingEntries.create({
      date,
      accounting_period_id,
      description,
      debit,
      credit,
      number,
    });

    if (accountingEntryData) {
      if (accountingEntry.AccountingEntriesDetails) {
        const entriesDetails = await AccountingEntriesDetails.bulkCreate(
          accountingEntry.AccountingEntriesDetails.map((entryDetail) => {
            return {
              ...entryDetail,
              accounting_entry_id: accountingEntryData.dataValues.id || 0,
            };
          }),
        );

        if (entriesDetails) {
          if (purchasePeriodId) {
            await PurchasePeriod.update(
              { accounting_entry_id: accountingEntryData.dataValues.id },
              { where: { id: purchasePeriodId } },
            );
          }
          return {
            ...accountingEntryData.dataValues,
            AccountingEntriesDetails: entriesDetails,
          };
        } else {
          throw Error('No se pudo crear el detalle de la entrada contable.');
        }
      }
    } else {
      throw Error('No se pudo crear la entrada contable.');
    }
  })(
    req.body,
    req.body.periodId,
    req.body.purchasePeriodId,
    req.body.sellsPeriodId,
  )
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const updateAccountingEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    accountingEntry: IAccountingEntries,
    accounting_period_id: number,
  ) {
    if (!(await checkDetails(accountingEntry, accounting_period_id))) {
      throw Error('La entrada contable no está balanceada.');
    }

    const { id, date, description, debit, credit, number } = accountingEntry;
    const accountingEntryData = await AccountingEntries.update(
      {
        date,
        accounting_period_id,
        description,
        debit,
        credit,
        number,
      },
      { where: { id } },
    );

    if (accountingEntryData) {
      await AccountingEntriesDetails.destroy({
        where: { accounting_entry_id: id },
      });
      if (accountingEntry.AccountingEntriesDetails) {
        const entriesDetails = await AccountingEntriesDetails.bulkCreate(
          accountingEntry.AccountingEntriesDetails.map((entryDetail) => {
            return {
              ...entryDetail,
              accounting_entry_id: id || 0,
            };
          }),
        );

        if (entriesDetails) {
          return {
            ...accountingEntry,
            AccountingEntriesDetails: entriesDetails,
          };
        } else {
          throw Error('No se pudo crear el detalle de la entrada contable.');
        }
      }
    } else {
      throw Error('No se pudo crear la entrada contable.');
    }
  })(req.body, req.body.periodId)
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getAccountingEntries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    page: number,
    filters: {
      dateFrom: string;
      dateTo: string;
      account: IAccountCharts;
      text: string;
      amountFrom: number;
      amountTo: number;
      number: number;
    },
    accounting_period_id: number,
  ) {
    const { dateFrom, dateTo, account, text, amountFrom, amountTo, number } =
      filters;
    if (page) {
      const ITEMS_PER_PAGE = 10;
      const offset = ((page || 1) - 1) * ITEMS_PER_PAGE;
      const { count, rows } = await AccountingEntries.findAndCountAll({
        where: [
          accounting_period_id ? { accounting_period_id } : {},
          dateFrom
            ? {
                date: {
                  [Op.gte]: dateFrom,
                },
              }
            : {},
          dateTo
            ? {
                date: {
                  [Op.lte]: dateTo,
                },
              }
            : {},
          number ? { number } : {},
          text
            ? {
                [Op.or]: [{ description: { [Op.substring]: text } }],
              }
            : {},
          amountFrom
            ? {
                [Op.or]: [
                  { debit: { [Op.gte]: amountFrom } },
                  { credit: { [Op.gte]: amountFrom } },
                ],
              }
            : {},
          amountTo
            ? {
                [Op.or]: [
                  { debit: { [Op.lte]: amountTo } },
                  { credit: { [Op.lte]: amountTo } },
                ],
              }
            : {},
        ],
        order: [[Columns.accountingEntries.number, 'ASC']],
        include: [
          {
            separate: account ? false : true,
            model: AccountingEntriesDetails,
            where: account ? { account_chart_id: account.id } : {},
            include: [
              {
                model: AccountChart,
              },
            ],
          },
        ],
        limit: ITEMS_PER_PAGE,
        offset: offset,
      });
      return {
        totalItems: count,
        itemsPerPage: ITEMS_PER_PAGE,
        items: rows,
      };
    } else {
      return await AccountingEntries.findAll({
        where: [
          accounting_period_id ? { accounting_period_id } : {},
          dateFrom
            ? {
                date: {
                  [Op.gte]: dateFrom,
                },
              }
            : {},
          dateTo
            ? {
                date: {
                  [Op.lte]: dateTo,
                },
              }
            : {},
          number ? { number } : {},
          text
            ? {
                [Op.or]: [{ description: { [Op.substring]: text } }],
              }
            : {},
          amountFrom
            ? {
                [Op.or]: [
                  { debit: { [Op.gte]: amountFrom } },
                  { credit: { [Op.gte]: amountFrom } },
                ],
              }
            : {},
          amountTo
            ? {
                [Op.or]: [
                  { debit: { [Op.lte]: amountTo } },
                  { credit: { [Op.lte]: amountTo } },
                ],
              }
            : {},
        ],
        order: [[Columns.accountingEntries.number, 'ASC']],
        include: [
          {
            separate: account ? false : true,
            model: AccountingEntriesDetails,
            where: account ? { account_chart_id: account.id } : {},
            include: [
              {
                model: AccountChart,
              },
            ],
          },
        ],
      });
    }
  })(Number(req.params.page), req.query as any, Number(req.body.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getJournalList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    page: number,
    filters: {
      dateFrom: string;
      dateTo: string;
      account: IAccountCharts;
      text: string;
      amountFrom: number;
      amountTo: number;
      number: number;
    },
    accounting_period_id: number,
  ) {
    const { dateFrom, dateTo, account, text, amountFrom, amountTo, number } =
      filters;
    const where: WhereOptions = [
      accounting_period_id ? { accounting_period_id } : {},
      dateFrom
        ? {
            date: {
              [Op.gte]: dateFrom,
            },
          }
        : {},
      dateTo
        ? {
            date: {
              [Op.lte]: dateTo,
            },
          }
        : {},
      number ? { number } : {},
      text
        ? {
            [Op.or]: [{ description: { [Op.substring]: text } }],
          }
        : {},
      amountFrom
        ? {
            [Op.or]: [
              { debit: { [Op.gte]: amountFrom } },
              { credit: { [Op.gte]: amountFrom } },
            ],
          }
        : {},
      amountTo
        ? {
            [Op.or]: [
              { debit: { [Op.lte]: amountTo } },
              { credit: { [Op.lte]: amountTo } },
            ],
          }
        : {},
    ];

    if (page) {
      const ITEMS_PER_PAGE = 10;
      const offset = ((page || 1) - 1) * ITEMS_PER_PAGE;
      let { count, rows } = await AccountingEntries.findAndCountAll({
        where,
        order: [[Columns.accountingEntries.number, 'ASC']],
        include: [
          {
            separate: account ? false : true,
            model: AccountingEntriesDetails,
            where: account ? { account_chart_id: account.id } : {},
            include: [
              {
                model: AccountChart,
              },
            ],
          },
        ],
        limit: ITEMS_PER_PAGE,
        offset: offset,
      });
      if (page > 1) {
        const previousBalances = await AccountingEntries.findAll({
          attributes: [
            [literal(`SUM(${Columns.accountingEntries.debit})`), 'totalDebit'],
            [
              literal(`SUM(${Columns.accountingEntries.credit})`),
              'totalCredit',
            ],
          ],
          where,
          order: [[Columns.accountingEntries.number, 'ASC']],
          include: [
            {
              separate: account ? false : true,
              model: AccountingEntriesDetails,
              where: account ? { account_chart_id: account.id } : {},
              include: [
                {
                  model: AccountChart,
                },
              ],
            },
          ],
          limit: (page - 1) * ITEMS_PER_PAGE,
        }).then((data) =>
          data.map((entry) => ({
            totalDebit: Number(entry.dataValues.totalDebit),
            totalCredit: Number(entry.dataValues.totalCredit),
          })),
        );
        let totalDebit = previousBalances[0].totalDebit || 0;
        let totalCredit = previousBalances[0].totalCredit || 0;
        let previousCredit = previousBalances[0].totalCredit || 0;
        let previousDebit = previousBalances[0].totalDebit || 0;
        const data = rows.map((entry, key) => {
          previousCredit =
            key > 0
              ? previousCredit + rows[key - 1].dataValues.credit
              : previousCredit;
          previousDebit =
            key > 0
              ? previousDebit + rows[key - 1].dataValues.debit
              : previousDebit;
          return {
            ...entry.dataValues,
            perviousCredit: previousCredit,
            perviousDebit: previousDebit,
            totalDebit: (totalDebit += entry.dataValues.debit),
            totalCredit: (totalCredit += entry.dataValues.credit),
          };
        });
        return {
          totalItems: count,
          itemsPerPage: ITEMS_PER_PAGE,
          items: data,
        };
      } else {
        let totalDebit = 0;
        let totalCredit = 0;
        let previousCredit = 0;
        let previousDebit = 0;
        const data = rows.map((entry, key) => {
          previousCredit =
            key > 0
              ? previousCredit + rows[key - 1].dataValues.credit
              : previousCredit;
          previousDebit =
            key > 0
              ? previousDebit + rows[key - 1].dataValues.debit
              : previousDebit;
          return {
            ...entry.dataValues,
            perviousCredit: previousCredit,
            perviousDebit: previousDebit,
            totalDebit: (totalDebit += entry.dataValues.debit),
            totalCredit: (totalCredit += entry.dataValues.credit),
          };
        });
        return {
          totalItems: count,
          itemsPerPage: ITEMS_PER_PAGE,
          items: data,
        };
      }
    }
  })(Number(req.params.page), req.query as any, Number(req.body.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const downloadPDF = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accountPeriodId: number, contain?: string) {
    const accountingList = await AccountChart.findAll({
      where: [
        { accounting_period_id: accountPeriodId },
        { name: { [Op.like]: `%${contain}%` } },
      ],
      order: [[`${Columns.accountCharts.code}`, 'ASC']],
    });
    const accountingPeriod = await AccountingPeriod.findOne({
      where: { id: accountPeriodId },
      include: [Client],
    });

    const control = new accountControl();

    let list: Array<IAccountChartsToFront> = [];

    accountingList.map((account) => {
      if (control.last.genre < account.dataValues.genre) {
        list.push(accountChartItem(account.dataValues, true));
        control.lastGenre(account.dataValues.genre);
        control.addCountGenre();
      } else if (control.last.group < account.dataValues.group) {
        list[control.count.genre - 1].subAccounts.push(
          accountChartItem(account.dataValues, false),
        );
        control.lastGroup(account.dataValues.group);
        control.addCountGroup();
      } else if (control.last.caption < account.dataValues.caption) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts.push(accountChartItem(account.dataValues, false));
        control.lastCaption(account.dataValues.caption);
        control.addCountCaption();
      } else if (control.last.account < account.dataValues.account) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts[control.count.caption - 1].subAccounts.push(
          accountChartItem(account.dataValues, false),
        );
        control.lastAccount(account.dataValues.account);
        control.addCountAccount();
      } else if (control.last.subAccount < account.dataValues.sub_account) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts[control.count.caption - 1].subAccounts[
          control.count.account - 1
        ].subAccounts.push(accountChartItem(account.dataValues, false));
        control.lastSubAccount(account.dataValues.sub_account);
        control.addCountSubAccount();
      }
    });
    const dataRequestPdf = {
      cuentas: list,
      bussinesName: `${accountingPeriod?.dataValues.Client?.business_name} (${accountingPeriod?.dataValues.Client?.document_number})`,
      periodStr: `${moment
        .utc(accountingPeriod?.dataValues.from_date)
        .format('DD/MM/YYYY')} - ${moment
        .utc(accountingPeriod?.dataValues.to_date)
        .format('DD/MM/YYYY')}`,
    };

    return pdfGenerator({
      data: dataRequestPdf,
      fileName: '-Plan-Cuentas',
      layoutPath: path.join('views', 'reports', 'accountList', 'index.ejs'),
      format: {
        landscape: false,
        format: 'A4',
        scale: 0.8,
        displayHeaderFooter: true,
        marginBottom: '3.35cm',
        marginTop: '0.5cm',
        headerTemplate: '<div></div>',
        footerTemplate:
          '<footer>Página <span class="pageNumber"></span> de <span class="pageCount"></span></footer>',
      },
    });
  })(
    Number(req.params.periodId),
    String(req.query.contain ? req.query.contain : ''),
  )
    .then((data) =>
      file(req, res, data.pdfAddress, 'application/pdf', data.fileName),
    )
    .catch(next);
};

export const downloadExcel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (accountPeriodId: number, contain?: string) {
    const accountingList = await AccountChart.findAll({
      where: [
        { accounting_period_id: accountPeriodId },
        { name: { [Op.like]: `%${contain}%` } },
      ],
      order: [[`${Columns.accountCharts.code}`, 'ASC']],
    });

    const control = new accountControl();

    let list: Array<IAccountChartsToFront> = [];

    accountingList.map((account) => {
      if (control.last.genre < account.dataValues.genre) {
        list.push(accountChartItem(account.dataValues, true));
        control.lastGenre(account.dataValues.genre);
        control.addCountGenre();
      } else if (control.last.group < account.dataValues.group) {
        list[control.count.genre - 1].subAccounts.push(
          accountChartItem(account.dataValues, false),
        );
        control.lastGroup(account.dataValues.group);
        control.addCountGroup();
      } else if (control.last.caption < account.dataValues.caption) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts.push(accountChartItem(account.dataValues, false));
        control.lastCaption(account.dataValues.caption);
        control.addCountCaption();
      } else if (control.last.account < account.dataValues.account) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts[control.count.caption - 1].subAccounts.push(
          accountChartItem(account.dataValues, false),
        );
        control.lastAccount(account.dataValues.account);
        control.addCountAccount();
      } else if (control.last.subAccount < account.dataValues.sub_account) {
        list[control.count.genre - 1].subAccounts[
          control.count.group - 1
        ].subAccounts[control.count.caption - 1].subAccounts[
          control.count.account - 1
        ].subAccounts.push(accountChartItem(account.dataValues, false));
        control.lastSubAccount(account.dataValues.sub_account);
        control.addCountSubAccount();
      }
    });
    return accountListExcel(list);
  })(
    Number(req.params.periodId),
    String(req.query.contain ? req.query.contain : ''),
  )
    .then((data) =>
      file(
        req,
        res,
        data.excelAddress,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        data.fileName,
      ),
    )
    .catch(next);
};

export const getLedger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    page: number,
    filters: {
      dateFrom: string;
      dateTo: string;
      account: number;
    },
    accounting_period_id: number,
  ) {
    const { dateFrom, dateTo, account } = filters;

    if (!account) {
      return {
        totalItems: 0,
        itemsPerPage: 0,
        items: [],
      };
    }
    const ITEMS_PER_PAGE = 10;
    const offset = ((page || 1) - 1) * ITEMS_PER_PAGE;

    const entriesWhere: WhereOptions = [
      accounting_period_id ? { accounting_period_id } : {},
      dateFrom
        ? {
            date: {
              [Op.gte]: dateFrom,
            },
          }
        : {},
      dateTo
        ? {
            date: {
              [Op.lte]: dateTo,
            },
          }
        : {},
    ];
    const entryDetailWhere: WhereOptions = [{ id: account }];

    const { count, rows } = await AccountingEntriesDetails.findAndCountAll({
      order: [[Columns.accountingEntriesDetails.id, 'ASC']],
      include: [
        {
          model: AccountingEntries,
          where: entriesWhere,
        },
        {
          model: AccountChart,
          where: entryDetailWhere,
        },
      ],
      limit: ITEMS_PER_PAGE,
      offset: offset,
    });

    const previousBalances = await AccountingEntriesDetails.findAll({
      attributes: [
        [
          literal(
            `SUM(AccountingEntriesDetails.${Columns.accountingEntriesDetails.debit})`,
          ),
          'totalDebit',
        ],
        [
          literal(
            `SUM(AccountingEntriesDetails.${Columns.accountingEntriesDetails.credit})`,
          ),
          'totalCredit',
        ],
        [
          literal(
            `SUM(AccountingEntriesDetails.${Columns.accountingEntriesDetails.debit} - AccountingEntriesDetails.${Columns.accountingEntriesDetails.credit})`,
          ),
          'balance',
        ],
      ],
      order: [[Columns.accountingEntriesDetails.id, 'ASC']],
      include: [
        {
          model: AccountingEntries,
          where: {
            date: {
              [Op.lt]: dateFrom,
            },
          },
          attributes: [],
        },
        {
          model: AccountChart,
          where: entryDetailWhere,
          attributes: [],
        },
      ],
    }).then((data) =>
      data.map((entry) => ({
        totalDebit: Number(entry.dataValues.totalDebit),
        totalCredit: Number(entry.dataValues.totalCredit),
        balance: Number(entry.dataValues.balance),
      })),
    );
    let totalDebit = previousBalances[0].totalDebit || 0;
    let totalCredit = previousBalances[0].totalCredit || 0;
    let totalBalance = previousBalances[0].balance || 0;
    let previousCredit = previousBalances[0].totalCredit || 0;
    let previousDebit = previousBalances[0].totalDebit || 0;
    let previousBalance = previousBalances[0].balance || 0;

    const data = rows.map((entry, key) => {
      previousCredit =
        key > 0
          ? previousCredit + rows[key - 1].dataValues.credit
          : previousCredit;
      previousDebit =
        key > 0
          ? previousDebit + rows[key - 1].dataValues.debit
          : previousDebit;
      previousBalance =
        key > 0
          ? previousBalance +
            rows[key - 1].dataValues.debit -
            rows[key - 1].dataValues.credit
          : previousBalance;
      return {
        ...entry.dataValues,
        perviousCredit: previousCredit,
        perviousDebit: previousDebit,
        perviousBalance: previousBalance,
        totalDebit: (totalDebit += entry.dataValues.debit),
        totalCredit: (totalCredit += entry.dataValues.credit),
        totalBalance: (totalBalance +=
          entry.dataValues.debit - entry.dataValues.credit),
      };
    });
    return {
      totalItems: count,
      itemsPerPage: ITEMS_PER_PAGE,
      items: data,
    };
  })(Number(req.params.page), req.query as any, Number(req.body.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const getBalance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    page: number,
    filters: {
      dateFrom: string;
      dateTo: string;
      accountFrom: string;
      accountTo: string;
    },
    accounting_period_id: number,
  ) {
    const { dateFrom, dateTo, accountFrom, accountTo } = filters;
    const ITEMS_PER_PAGE = 10;
    const offset = ((page || 1) - 1) * ITEMS_PER_PAGE;

    const entriesWhere: WhereOptions = [
      { accounting_period_id },
      dateFrom
        ? {
            date: {
              [Op.gte]: dateFrom,
            },
          }
        : {},
      dateTo
        ? {
            date: {
              [Op.lte]: dateTo,
            },
          }
        : {},
    ];
    const entryDetailWhere: WhereOptions = [
      accountFrom ? { code: { [Op.gte]: accountFrom } } : {},
      accountTo ? { code: { [Op.lte]: accountTo } } : {},
    ];

    const { count, rows } = await AccountingEntriesDetails.findAndCountAll({
      attributes: {
        include: [
          [
            literal(
              `SUM(AccountingEntriesDetails.${Columns.accountingEntriesDetails.debit})`,
            ),
            'totalDebit',
          ],
          [
            literal(
              `SUM(AccountingEntriesDetails.${Columns.accountingEntriesDetails.credit})`,
            ),
            'totalCredit',
          ],
          [
            literal(
              `SUM(AccountingEntriesDetails.${Columns.accountingEntriesDetails.debit} - AccountingEntriesDetails.${Columns.accountingEntriesDetails.credit})`,
            ),
            'balance',
          ],
        ],
      },
      order: [literal(`AccountChart.${Columns.accountCharts.code}`)],
      group: [`AccountChart.${Columns.accountCharts.code}`],
      include: [
        {
          model: AccountingEntries,
          where: entriesWhere,
        },
        {
          model: AccountChart,
          where: entryDetailWhere,
        },
      ],
      limit: ITEMS_PER_PAGE,
      offset: offset,
    });
    return {
      totalItems: count.length,
      itemsPerPage: ITEMS_PER_PAGE,
      items: rows,
    };
  })(Number(req.params.page), req.query as any, Number(req.body.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const checkEntryNumberChange = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    accounting_period_id: number,
    entryNumber: number,
    newEntryNumber: number,
  ) {
    const type =
      entryNumber > newEntryNumber ? 1 : entryNumber < newEntryNumber ? 2 : 0;
    const lastEntryNumber = await AccountingEntries.findOne({
      attributes: [
        [fn('MAX', col(`${Columns.accountingEntries.number}`)), 'lastEntry'],
      ],
      where: { accounting_period_id },
    }).then((data) => data?.dataValues.lastEntry);
    if (lastEntryNumber && entryNumber > lastEntryNumber) {
      throw Error(
        'El número de entrada contable no puede ser mayor al último número de entrada contable.',
      );
    }
    if (lastEntryNumber && entryNumber < 1) {
      throw Error('El número de entrada contable no puede ser menor a 1.');
    }

    const minDateEntry = await AccountingEntries.findOne({
      attributes: [Columns.accountingEntries.date],
      where: [
        { accounting_period_id },
        { number: type === 2 ? newEntryNumber : newEntryNumber - 1 },
      ],
    }).then((data) => data?.dataValues.date);

    const maxDateEntry = await AccountingEntries.findOne({
      attributes: [Columns.accountingEntries.date],
      where: [
        { accounting_period_id },
        { number: type === 1 ? newEntryNumber : newEntryNumber + 1 },
      ],
    }).then((data) => data?.dataValues.date);

    return {
      minLimitDate: minDateEntry,
      maxLimitDate: maxDateEntry,
    };
  })(
    Number(req.params.periodId),
    Number(req.params.number),
    Number(req.params.newNumber),
  )
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const reorderEntries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (
    accounting_period_id: number,
    entryNumber: number,
    entryId: number,
    newEntryNumber: number,
    newEntryDate: string,
  ) {
    const entry = await AccountingEntries.findOne({
      where: [
        { accounting_period_id },
        { number: entryNumber },
        { id: entryId },
      ],
    });
    if (entry) {
      const type =
        entryNumber > newEntryNumber ? 1 : entryNumber < newEntryNumber ? 2 : 0;
      const { updateAll, attributesAll } = getUpdateAttributes(
        type,
        accounting_period_id,
        entryId,
        newEntryNumber,
        entryNumber,
      );

      if (updateAll) {
        await AccountingEntries.update(updateAll, attributesAll);
      }

      return await AccountingEntries.update(
        {
          number: newEntryNumber,
          date: moment(newEntryDate),
        },
        {
          where: [{ id: entryId }, { accounting_period_id }],
        },
      );
    } else {
      throw Error('No se encontró la entrada contable.');
    }
  })(
    req.body.periodId,
    req.body.number,
    req.body.id,
    req.body.newNumber,
    req.body.newDate,
  )
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};

export const deleteEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  (async function (entryId: number, accounting_period_id: number) {
    const entry = await AccountingEntries.findOne({
      where: [{ id: entryId }, { accounting_period_id }],
    });
    if (entry) {
      const updateAttribute = getUpdateAttributes(
        3,
        accounting_period_id,
        entryId,
        entry.dataValues.number,
        entry.dataValues.number,
      );
      if (updateAttribute.updateAll) {
        await AccountingEntries.update(
          updateAttribute.updateAll,
          updateAttribute.attributesAll,
        );
        return await AccountingEntries.destroy({
          where: { id: entryId },
        });
      }
    }
  })(Number(req.params.entryId), Number(req.params.periodId))
    .then((data) => success({ req, res, message: data }))
    .catch(next);
};
