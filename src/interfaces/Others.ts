import { IAccountCharts } from "./Tables"

export interface IEmailSendPass {
    Colors: object,
    Links: object,
    Names: object,
    titlePage: string,
    titleHead: string,
    paragraphHead: Array<string>,
    titleButton: string,
    textCall: string,
    textCall2: string,
    textFooter: string
}

export interface IListResponse {
    totalItems: number,
    itemsPerPage: number,
    items: Array<any>
}

export interface INewPermissions {
    permissions: Array<INewPermission>,
    idUser: number
}

export interface INewPermission {
    idPermission: number,
    idClient: number,
    permissionGrade: number,
    clientEnabled: boolean
}

export interface IPermissions {
    client_id: number,
    business_name: string,
    permission_grade_id: number,
    module_id: number
}

export interface IPermissionsRequest {
    client_id: number,
    business_name: string,
    permissions: Array<IPermissions>
}
export interface IModulesPermissions {
    module_id: number,
    module_name: string,
    permission_grade: number
}

export interface IAccountChartsToFront extends IAccountCharts {
    principal: boolean,
    subAccounts: Array<IAccountChartsToFront>
}

export interface IDataSheetCVSPurchaseImport {
    date: Date,
    invoiceType: number,
    sellPoint: number,
    invoiceNumber: number,
    cae: string,
    providerDocumentType: number,
    providerDocumentNumber: number,
    providerName: string,
    changeType: number,
    changeSymbol: string,
    netRecorded: number,
    netNotRecorded: number,
    exemptOperation: number,
    otherTributes: number,
    totalVat: number,
    totalInvoice: number
}

export interface IDataSheetCVSPurchaseImportComplete {
    date: Date,
    invoiceType: number,
    sellPoint: number,
    invoiceNumber: number,
    documentType: number,
    documentNumber: number,
    providerName: string,
    totalInvoice: number,
    unrecorded: number,
    exemptOperation: number,
    nationalTaxes: number,
    grossIncome: number,
    localTaxes: number,
    vatWithholdings: number,
    internalTaxes: number,
    otherTributes: number,
    '0_00VatBase': number,
    '2_50VatBase': number,
    '2_50Vat': number,
    '5_00VatBase': number,
    '5_00Vat': number,
    '10_50VatBase': number,
    '10_50Vat': number,
    '21_00VatBase': number,
    '21_00Vat': number,
    '27_00VatBase': number,
    '27_00Vat': number,
    totalRecorded: number,
    totalVat: number,
}