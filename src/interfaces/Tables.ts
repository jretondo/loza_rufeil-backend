export interface IAuth {
    id?: number,
    user: string,
    pass?: string,
    prov: number,
    admin_id: number
}
export interface IUser {
    id?: number,
    name: string,
    lastname: string
    email: string,
    user: string,
    phone: string,
    admin?: boolean,
    userName?: string
}
export interface IModules {
    id?: number,
    module_name: string
}

export interface IActivity {
    id?: number,
    date?: Date,
    user_id: number,
    activity_description: string
}

export interface IClients {
    id?: number,
    document_type: number,
    document_number: string,
    business_name: string,
    fantasie_name: string,
    email: string,
    iva_condition_id: number,
    direction: string,
    phone: string,
    city: string,
    activity_description: number
}

export interface IProviders {
    id?: number,
    document_type: number,
    document_number: string,
    business_name: string,
    fantasie_name: string,
    iva_condition_id: number,
    direction: string,
    city: string,
    activity_description: string
}

export interface ICostumers {
    id?: number,
    document_type: number,
    document_number: string,
    business_name: string,
    fantasie_name: string,
    iva_condition_id: number,
    direction: string,
    city: string,
    activity_description: string
}

export interface IIvaConditions {
    id?: number,
    description: string
}

export interface IInvoiceTypes {
    id?: number,
    description: string,
    letter: string
}

export interface IIvaTypes {
    id?: number,
    name: string,
    percentage: number
}

export interface IAfipCrt {
    id?: number,
    document_number: string,
    business_name: string,
    crt_file?: string,
    key_file?: string,
    enabled?: boolean,
    crt_name: string
}

export interface ITributeTypes {
    id?: number,
    name: string
}

export interface IPermissionsGrades {
    id?: number,
    name: string
}

export interface IClientsModules {
    id?: number,
    client_id: number,
    module_id: number,
    active: boolean
}

export interface IAdminPermission {
    id?: number,
    user_id: number,
    client_id: number,
    permission_grade_id: number,
    module_id: number
}

export interface IAccountingPeriod {
    id?: number,
    from_date: Date,
    to_date: Date,
    client_id: number,
    closed: boolean,
    Client?: IClients
}

export interface IAccountCharts {
    id?: number,
    genre: number,
    group: number,
    caption: number,
    account: number,
    sub_account: number,
    code: string,
    name: string,
    attributable: boolean,
    inflation_adjustment: boolean,
    accounting_period_id: number
}

export interface IPurchasePeriods {
    id?: number,
    month: number,
    year: number,
    accounting_period_id: number,
    closed?: boolean,
    accounting_entry_id?: number | null,
    AccountingPeriod?: IAccountingPeriod
}

export interface IReceipts {
    id?: number,
    date: Date,
    invoice_type_id: number,
    sell_point: number,
    number: number,
    total: number,
    unrecorded: number, //No grabado
    exempt_transactions: number, //Operaciones exentas
    vat_withholdings: number, //Percepciones de IVA
    national_tax_withholdings: number, //Percepciones de impuestos nacionales
    gross_income_withholdings: number, //Percepciones de ingresos brutos
    local_tax_withholdings: number, //Percepciones municipales
    internal_tax: number, //Impuestos internos
    vat_rates_quantity: number, //Cantidad de alícuotas de IVA  
    provider_id: number,
    purchase_period_id: number,
    observation: string,
    word: string,
    receipt_type: number,
    Provider?: IProviders,
    VatRatesReceipts?: IVatRatesReceipts[] | any,
    VatRateReceipts?: IVatRatesReceipts[],
    PurchaseEntries?: IPurchaseEntries[],
    ProviderAFIP?: any,
    checked?: boolean
}

export interface IVatRatesReceipts {
    id?: number,
    receipt_id: number,
    recorded_net: number, //Neto gravado
    vat_type_id: number, //Tipo de IVA
    vat_amount: number //Importe de IVA
}

export interface IPurchaseParameters {
    id?: number,
    client_id: number,
    type: number,
    is_vat: boolean,
    active: boolean,
    account_chart_id: number,
    accounting_period_id: number,
    is_tax: boolean,
    AccountChart?: IAccountCharts
}

export interface IPaymentTypesParameters {
    id?: number,
    client_id: number,
    name: string,
    active: boolean,
    account_chart_id: number,
    accounting_period_id: number,
    AccountChart?: IAccountCharts,
    amount?: number
}

export interface IProvidersParameters {
    id?: number,
    provider_id: number,
    active: boolean,
    description: string,
    account_chart_id: number | null,
    accounting_period_id: number | null,
    AccountChart?: IAccountCharts,
    amount?: number
}

export interface ICustomersParameters {
    id?: number,
    customer_id: number,
    active: boolean,
    description: string,
    account_chart_id: number | null,
    accounting_period_id: number | null,
    AccountChart?: IAccountCharts
}

export interface IHeaderReceiptReq {
    date: Date,
    total: number,
    type: {
        id: number,
        name: string
    },
    word: string,
    sellPoint: number,
    number: number,
}

export interface IPaymentReceiptReq {
    account_chart_id: number,
    accounting_period_id: number,
    amount: number,
    name: string,
}

export interface ITaxesReceiptReq {
    active?: boolean
    type: number,
    amount: number,
    is_vat: boolean,
    name: string,
    AccountChart?: IAccountCharts,
    recorded: number
}

export interface IReceiptConcept {
    account_chart_id: number,
    accounting_period_id: number,
    amount: number,
    description: string,
    AccountChart?: IAccountCharts
    recordType: number,
}

export interface IPurchaseEntries {
    id?: number,
    date: Date,
    receipt_id: number,
    account_chart_id: number | null,
    purchase_period_id: number,
    description: string,
    debit: number,
    credit: number
}

export interface IAccountingEntries {
    id?: number,
    date: Date | string,
    accounting_period_id: number,
    description: string,
    debit: number,
    credit: number,
    number: number,
    lastEntry?: number,
    lastDate?: Date,
    firstDate?: Date,
    totalDebit?: number,
    totalCredit?: number,
    perviousCredit?: number,
    perviousDebit?: number,
    AccountingEntriesDetails?: IAccountingEntryDetail[]
}

export interface IAccountingEntryDetail {
    id?: number,
    account_chart_id: number,
    debit: number,
    credit: number,
    accounting_entry_id: number,
    balance?: number,
    totalDebit?: number,
    totalCredit?: number,
}