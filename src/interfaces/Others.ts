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
    enabled: boolean,
    modules: Array<IModulesPermissions>
}

export interface IModulesPermissions {
    module_id: number,
    module_name: string,
    permission_grade: number
}

export interface IAccountChartsToFront extends IAccountCharts {
    open: boolean,
    principal: boolean,
    subAccounts: Array<IAccountChartsToFront>
}