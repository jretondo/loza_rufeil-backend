enum Admin {
    id = 'id',
    name = 'name',
    lastname = 'lastname',
    email = 'email',
    user = 'user',
    phone = 'phone'
}

enum AuthAdm {
    id = 'id',
    user = 'user',
    pass = 'pass',
    prov = 'prov',
    admin_id = "admin_id"
}

enum AdminPermission {
    id = "id",
    admin_id = "admin_id",
    module_id = "module_id",
    client_id = "client_id",
    permission_grade = "permission_grade",
    client_enabled = "client_enabled"
}

enum Modules {
    id = "id",
    module_name = "module_name"
}

enum Activity {
    id = "id",
    date = "date",
    user_id = "user_id",
    activity_description = "activity_description"
}

enum Clients {
    id = "id",
    document_type = "document_type",
    document_number = "document_number",
    business_name = "business_name",
    fantasie_name = "fantasie_name",
    email = "email",
    iva_condition_id = "iva_condition_id",
    direction = "direction",
    phone = "phone",
    city = "city",
    activity_description = "activity_description",
}

enum Providers {
    id = "id",
    document_type = "document_type",
    document_number = "document_number",
    business_name = "business_name",
    fantasie_name = "fantasie_name",
    iva_condition_id = "iva_condition_id",
    direction = "direction",
    city = "city",
    activity_description = "activity_description"
}

enum IvaConditions {
    id = "id",
    description = "description"
}

enum InvoiceTypes {
    id = "id",
    description = "description",
    letter = "letter"
}

enum IvaTypes {
    id = "id",
    name = "name",
    percentage = "percentage"
}

enum AfipCrt {
    id = "id",
    cuit = "cuit",
    crt_file = "crt_file",
    key_file = "key_file",
    business_name = "business_name",
    document_number = "document_number",
    crt_name = "crt_name",
    enabled = "enabled"
}

enum AccountingPeriod {
    id = "id",
    from_date = "from_date",
    to_date = "to_date",
    client_id = "client_id",
    closed = "closed"
}

enum AccountCharts {
    id = "id",
    genre = "genre",
    group = "group",
    caption = "caption",
    account = "account",
    sub_account = "sub_account",
    code = "code",
    name = "name",
    attributable = "attributable",
    inflation_adjustment = "inflation_adjustment",
    accounting_period_id = "accounting_period_id"
}

export enum Tables {
    ADMIN = "admins",
    AUTH_ADMIN = "auth_admin",
    ADMIN_PERMISSIONS = "admin_permissions",
    MODULES = "modules",
    ACTIVITY = "activities",
    CLIENTS = "clients",
    IVA_CONDITIONS = "iva_conditions",
    INVOICE_TYPES = "invoice_types",
    IVA_TYPES = "iva_types",
    AFIP_CRT = "afip_crt",
    PROVIDERS = "providers",
    ACCOUNTING_PERIOD = "accounting_period",
    ACCOUNT_CHARTS = "account_charts"
}

export const Columns = {
    admin: Admin,
    authAdmin: AuthAdm,
    adminPermissions: AdminPermission,
    modules: Modules,
    activity: Activity,
    clients: Clients,
    ivaConditions: IvaConditions,
    invoiceTypes: InvoiceTypes,
    ivaTypes: IvaTypes,
    afipCrt: AfipCrt,
    providers: Providers,
    accountingPeriod: AccountingPeriod,
    accountCharts: AccountCharts
}