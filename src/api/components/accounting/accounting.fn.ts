import { Op, Sequelize, UpdateOptions, literal } from "sequelize"
import { Columns } from "../../../constant/TABLES"
import { IAccountChartsToFront } from "../../../interfaces/Others"
import { IAccountCharts, IAccountingEntries, IAccountingPeriod } from "../../../interfaces/Tables"
import AccountChart from "../../../models/AccountCharts"
import AccountingPeriod from "../../../models/AccountingPeriod"
import Client from "../../../models/Client"
import moment from "moment"
import path from 'path';
import fs from 'fs';
import JsReport from "jsreport-core"
import { promisify } from "util"
import ejs from "ejs"
import { utils, write } from "xlsx"

export const nextChildrenAccount = async (accountData: AccountChart | null): Promise<AccountChart | null> => {
    if (accountData?.dataValues.group === 0) {
        let nextAccount: AccountChart | null = await AccountChart.findOne({
            attributes: {
                include: [[Sequelize.literal("`" + `${Columns.accountCharts.group}` + "`" + ` + 1`), `${Columns.accountCharts.group}`]],
                exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
            },
            where: [
                { genre: accountData.dataValues.genre },
                { group: { [Op.gt]: 0 } },
                { caption: 0 },
                { account: 0 },
                { sub_account: 0 },
                { accounting_period_id: accountData.dataValues.accounting_period_id }
            ],
            order: [[`${Columns.accountCharts.group}`, "DESC"]]
        })
        if (nextAccount?.dataValues) {
            return nextAccount
        } else {
            nextAccount = accountData
            nextAccount.dataValues.group = 1
            return nextAccount
        }
    } else if (accountData?.dataValues.caption === 0) {
        let nextAccount: AccountChart | null = await AccountChart.findOne({
            attributes: {
                include: [[Sequelize.literal("`" + `${Columns.accountCharts.caption}` + "`" + ` + 1`), `${Columns.accountCharts.caption}`]],
                exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
            },
            where: [
                { genre: accountData.dataValues.genre },
                { group: accountData.dataValues.group },
                { caption: { [Op.gt]: 0 } },
                { account: 0 },
                { sub_account: 0 },
                { accounting_period_id: accountData.dataValues.accounting_period_id }
            ],
            order: [[`${Columns.accountCharts.caption}`, "DESC"]]
        })
        if (nextAccount?.dataValues) {
            return nextAccount
        } else {
            nextAccount = accountData
            nextAccount.dataValues.caption = 1
            return nextAccount
        }
    } else if (accountData?.dataValues.account === 0) {
        let nextAccount: AccountChart | null = await AccountChart.findOne({
            attributes: {
                include: [[Sequelize.literal("`" + `${Columns.accountCharts.account}` + "`" + ` + 1`), `${Columns.accountCharts.account}`]],
                exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
            },
            where: [
                { genre: accountData.dataValues.genre },
                { group: accountData.dataValues.group },
                { caption: accountData.dataValues.caption },
                { account: { [Op.gt]: 0 } },
                { sub_account: 0 },
                { accounting_period_id: accountData.dataValues.accounting_period_id }
            ],
            order: [[`${Columns.accountCharts.account}`, "DESC"]]
        })
        if (nextAccount?.dataValues) {
            return nextAccount
        } else {
            nextAccount = accountData
            nextAccount.dataValues.account = 1
            return nextAccount
        }
    } else if (accountData?.dataValues.sub_account === 0) {
        let nextAccount: AccountChart | null = await AccountChart.findOne({
            attributes: {
                include: [[Sequelize.literal("`" + `${Columns.accountCharts.sub_account}` + "`" + ` + 1`), `${Columns.accountCharts.sub_account}`]],
                exclude: [`${Columns.accountCharts.name}`, `${Columns.accountCharts.code}`, `${Columns.accountCharts.id}`]
            },
            where: [
                { genre: accountData.dataValues.genre },
                { group: accountData.dataValues.group },
                { caption: accountData.dataValues.caption },
                { account: accountData.dataValues.account },
                { sub_account: { [Op.gt]: 0 } },
                { accounting_period_id: accountData.dataValues.accounting_period_id }
            ],
            order: [[`${Columns.accountCharts.sub_account}`, "DESC"]]
        })
        if (nextAccount?.dataValues) {
            return nextAccount
        } else {
            nextAccount = accountData
            nextAccount.dataValues.sub_account = 1
            return nextAccount
        }
    }
    return null
}

export const accountChartItem = (account: IAccountCharts, principal: boolean): IAccountChartsToFront => {
    return {
        id: account.id,
        genre: account.genre,
        group: account.group,
        caption: account.caption,
        account: account.account,
        sub_account: account.sub_account,
        code: account.code,
        name: account.name,
        attributable: account.attributable,
        inflation_adjustment: account.inflation_adjustment,
        accounting_period_id: account.accounting_period_id,
        principal: principal,
        subAccounts: []
    }
}

export const initialAccountChart = (accountPeriodId: number): Array<IAccountCharts> => {
    return ([
        {
            genre: 1,
            group: 0,
            caption: 0,
            account: 0,
            sub_account: 0,
            inflation_adjustment: false,
            attributable: false,
            code: "100000000",
            name: "ACTIVO",
            accounting_period_id: accountPeriodId
        },
        {
            genre: 2,
            group: 0,
            caption: 0,
            account: 0,
            sub_account: 0,
            inflation_adjustment: false,
            attributable: false,
            code: "200000000",
            name: "PASIVO",
            accounting_period_id: accountPeriodId
        },
        {
            genre: 3,
            group: 0,
            caption: 0,
            account: 0,
            sub_account: 0,
            inflation_adjustment: false,
            attributable: false,
            code: "300000000",
            name: "PATRIMONIO NETO",
            accounting_period_id: accountPeriodId
        },
        {
            genre: 4,
            group: 0,
            caption: 0,
            account: 0,
            sub_account: 0,
            inflation_adjustment: false,
            attributable: false,
            code: "400000000",
            name: "RESULTADO POSITIVO",
            accounting_period_id: accountPeriodId
        },
        {
            genre: 5,
            group: 0,
            caption: 0,
            account: 0,
            sub_account: 0,
            inflation_adjustment: false,
            attributable: false,
            code: "500000000",
            name: "RESULTADO NEGATIVO",
            accounting_period_id: accountPeriodId
        }
    ])
}

export const newDefaultAccountCharts = async (accountPeriodId: number) => {
    if ((accountPeriodId) > 0) {
        return await AccountChart.bulkCreate(initialAccountChart(accountPeriodId))
    } else {
        return null
    }
}

export const periodListFn = async (clientId: number, fromDate?: Date, toDate?: Date) => {
    if (fromDate) {
        return await AccountingPeriod.findAll({
            where:
            {
                [Op.and]: [
                    { client_id: clientId },
                    {
                        [Op.and]: [
                            { from_date: { [Op.lte]: toDate } },
                            { to_date: { [Op.gte]: fromDate } }
                        ]
                    }]
            },
            include: Client
        });
    }

    return await AccountingPeriod.findAll({
        where: [{ client_id: clientId }],
        order: [[`${Columns.accountingPeriod.from_date}`, 'DESC']],
        include: Client
    });
}

export const checkDetails = async (entry: IAccountingEntries, accounting_period_id: number) => {

    const debitDetails = entry.AccountingEntriesDetails?.reduce((acc, detail) => {
        return acc + detail.debit
    }, 0)

    const creditDetails = entry.AccountingEntriesDetails?.reduce((acc, detail) => {
        return acc + detail.credit
    }, 0)

    if (entry.debit !== debitDetails || entry.credit !== creditDetails) {
        return false
    }

    if (entry.debit === 0 && entry.credit === 0) {
        return false
    }

    if (entry.debit !== entry.credit || debitDetails !== creditDetails) {
        return false
    }

    const validCharts = await AccountChart.findAll({
        where: [
            { id: { [Op.in]: entry.AccountingEntriesDetails?.map(detail => detail.account_chart_id) } },
            { accounting_period_id: accounting_period_id }
        ]
    })

    if (validCharts.length !== entry.AccountingEntriesDetails?.length) {
        return false
    }

    return true
}


export const accountListPDF = async (accountList: any, client: string, periodStr: string): Promise<{
    pdfAddress: string,
    fileName: string
}> => {
    const uniqueSuffix = moment().format("YYYYMMDDHHmmss")
    const pdfAddress = path.join("public", "reports", "excel", uniqueSuffix + "-Plan-Cuentas.xlsx")
    return new Promise(async (resolve, reject) => {
        const datos = {
            cuentas: accountList,
            bussinesName: client,
            periodStr: periodStr
        }

        const jsreport = JsReport({
            extensions: {
                "chrome-pdf": {
                    "launchOptions": {
                        "args": ["--no-sandbox"]
                    }
                }
            }
        })

        jsreport.use(require('jsreport-chrome-pdf')())

        const writeFileAsync = promisify(fs.writeFile)
        await ejs.renderFile(path.join("views", "reports", "accountList", "index.ejs"), datos, async (err, data) => {
            if (err) {
                console.log('err', err);
                throw new Error("Algo salio mal")
            }

            await jsreport.init()

            jsreport.render({
                template: {
                    content: data,
                    name: 'lista',
                    engine: 'none',
                    recipe: 'chrome-pdf',
                    chrome: {
                        "landscape": false,
                        "format": "A4",
                        "scale": 0.8,
                        displayHeaderFooter: true,
                        marginBottom: "3.35cm",
                        marginTop: "0.5cm",
                        headerTemplate: '<div></div>',
                        footerTemplate: '<footer>Página <span class="pageNumber"></span> de <span class="pageCount"></span></footer>',
                    },

                },
            })
                .then(async (out) => {
                    await writeFileAsync(pdfAddress, out.content)
                    await jsreport.close()
                    const dataFact = {
                        pdfAddress,
                        fileName: uniqueSuffix + "-Plan-Cuentas.xlsx"
                    }
                    resolve(dataFact)
                })
                .catch((e) => {
                    reject(e)
                });
        })
    })
}

export const accountListExcel = (accountList: any) => {
    const wb = utils.book_new();
    const ws = utils.aoa_to_sheet([
        ['ID', 'Código', 'Nombre', 'Imputable', 'Ajuste por inflación']
    ]);
    agregarCuentas(ws, accountList, 1);
    utils.book_append_sheet(wb, ws, 'Cuentas');

    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'buffer' });
    const uniqueSuffix = moment().format("YYYYMMDDHHmmss")
    const excelAddress = path.join("public", "reports", "excel", uniqueSuffix + "-Plan-Cuentas.pdf")
    fs.writeFileSync(excelAddress, excelBuffer);

    return {
        excelAddress,
        fileName: uniqueSuffix + "-Plan-Cuentas.xlsx"
    }
}

function agregarCuentas(ws: any, cuentas: any, rowNum: any) {
    cuentas.forEach((cuenta: any) => {
        const rowData = [
            cuenta.id,
            cuenta.code,
            cuenta.name,
            cuenta.attributable,
            cuenta.inflation_adjustment
        ];
        utils.sheet_add_aoa(ws, [rowData], { origin: rowNum++ });

        if (cuenta.subAccounts && cuenta.subAccounts.length > 0) {
            rowNum = agregarCuentas(ws, cuenta.subAccounts, rowNum);
        }
    });

    return rowNum;
}

export const getUpdateAttributes = (type: number, accounting_period_id: number, entryId: number, newEntryNumber: number, entryNumber: number) => {
    let updateAll = undefined;
    let attributesAll: UpdateOptions = {
        fields: [Columns.accountingEntries.date],
        where: [{ accounting_period_id }, { id: entryId }],
        validate: true,
    };
    switch (type) {
        case 1:
            attributesAll.where = [
                { number: { [Op.gte]: newEntryNumber } },
                { number: { [Op.lt]: entryNumber } },
                { accounting_period_id }
            ];
            attributesAll.fields = [Columns.accountingEntries.number, Columns.accountingEntries.date];
            updateAll = { number: literal(`${Columns.accountingEntries.number} + 1`) };
            break;
        case 2:
            attributesAll.where = [
                { number: { [Op.gt]: entryNumber } },
                { number: { [Op.lte]: newEntryNumber } },
                { accounting_period_id }
            ];
            attributesAll.fields = [Columns.accountingEntries.number, Columns.accountingEntries.date];
            updateAll = { number: literal(`${Columns.accountingEntries.number} - 1`) };
            break;
        default:
            break;
    }
    return { updateAll, attributesAll };
};