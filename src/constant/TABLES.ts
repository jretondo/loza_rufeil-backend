enum Admin {
  id = 'id',
  name = 'name',
  lastname = 'lastname',
  email = 'email',
  user = 'user',
  phone = 'phone',
}

enum AuthAdm {
  id = 'id',
  user = 'user',
  pass = 'pass',
  prov = 'prov',
  admin_id = 'admin_id',
}

enum AdminPermission {
  id = 'id',
  user_id = 'user_id',
  client_id = 'client_id',
  permission_grade_id = 'permission_grade_id',
  module_id = 'module_id',
}

enum Modules {
  id = 'id',
  module_name = 'module_name',
}

enum Activity {
  id = 'id',
  date = 'date',
  user_id = 'user_id',
  activity_description = 'activity_description',
}

enum Clients {
  id = 'id',
  document_type = 'document_type',
  document_number = 'document_number',
  business_name = 'business_name',
  fantasie_name = 'fantasie_name',
  email = 'email',
  iva_condition_id = 'iva_condition_id',
  direction = 'direction',
  phone = 'phone',
  city = 'city',
  activity_description = 'activity_description',
}

enum Customers {
  id = 'id',
  document_type = 'document_type',
  document_number = 'document_number',
  business_name = 'business_name',
  fantasie_name = 'fantasie_name',
  email = 'email',
  iva_condition_id = 'iva_condition_id',
  direction = 'direction',
  phone = 'phone',
  city = 'city',
  activity_description = 'activity_description',
}

enum Providers {
  id = 'id',
  document_type = 'document_type',
  document_number = 'document_number',
  business_name = 'business_name',
  fantasie_name = 'fantasie_name',
  iva_condition_id = 'iva_condition_id',
  direction = 'direction',
  city = 'city',
  activity_description = 'activity_description',
}

enum IvaConditions {
  id = 'id',
  description = 'description',
}

enum InvoiceTypes {
  id = 'id',
  description = 'description',
  letter = 'letter',
}

enum IvaTypes {
  id = 'id',
  name = 'name',
  percentage = 'percentage',
}

enum AfipCrt {
  id = 'id',
  cuit = 'cuit',
  crt_file = 'crt_file',
  key_file = 'key_file',
  business_name = 'business_name',
  document_number = 'document_number',
  crt_name = 'crt_name',
  enabled = 'enabled',
}

enum AccountingPeriod {
  id = 'id',
  from_date = 'from_date',
  to_date = 'to_date',
  client_id = 'client_id',
  closed = 'closed',
}

enum AccountCharts {
  id = 'id',
  genre = 'genre',
  group = 'group',
  caption = 'caption',
  account = 'account',
  sub_account = 'sub_account',
  code = 'code',
  name = 'name',
  attributable = 'attributable',
  inflation_adjustment = 'inflation_adjustment',
  accounting_period_id = 'accounting_period_id',
}

enum ClientsPermissions {
  id = 'id',
  client_id = 'client_id',
  module_id = 'module_id',
}

enum Receipts {
  id = 'id',
  date = 'date',
  invoice_type_id = 'invoice_type_id',
  sell_point = 'sell_point',
  number = 'number',
  total = 'total',
  unrecorded = 'unrecorded',
  exempt_transactions = 'exempt_transactions',
  vat_withholdings = 'vat_withholdings',
  national_tax_withholdings = 'national_tax_withholdings',
  gross_income_withholdings = 'gross_income_withholdings',
  local_tax_withholdings = 'local_tax_withholdings',
  internal_tax = 'internal_tax',
  vat_rates_quantity = 'vat_rates_quantity',
  provider_id = 'provider_id',
  purchase_period_id = 'purchase_period_id',
  observation = 'observation',
}

enum Invoices {
  id = 'id',
  date = 'date',
  invoice_type_id = 'invoice_type_id',
  sell_point = 'sell_point',
  number = 'number',
  total = 'total',
  unrecorded = 'unrecorded',
  exempt_transactions = 'exempt_transactions',
  vat_withholdings = 'vat_withholdings',
  national_tax_withholdings = 'national_tax_withholdings',
  gross_income_withholdings = 'gross_income_withholdings',
  local_tax_withholdings = 'local_tax_withholdings',
  internal_tax = 'internal_tax',
  vat_rates_quantity = 'vat_rates_quantity',
  customer_id = 'customer_id',
  sell_period_id = 'sell_period_id',
  observation = 'observation',
}

enum PurchaseRatesReceipts {
  id = 'id',
  receipt_id = 'receipt_id',
  recorded_net = 'recorded_net',
  vat_type_id = 'vat_type_id',
  vat_amount = 'vat_amount',
}

enum PurchasesPeriods {
  id = 'id',
  month = 'month',
  year = 'year',
  accounting_period_id = 'accounting_period_id',
  closed = 'closed',
  accounting_entry_id = 'accounting_entry_id',
}

enum SellPeriods {
  id = 'id',
  month = 'month',
  year = 'year',
  accounting_period_id = 'accounting_period_id',
  closed = 'closed',
  accounting_entry_id = 'accounting_entry_id',
}

enum PurchaseParameters {
  id = 'id',
  client_id = 'client_id',
  type = 'type',
  is_vat = 'is_vat',
  active = 'active',
  account_chart_id = 'account_chart_id',
  accounting_period_id = 'accounting_period_id',
}

enum SellParameters {
  id = 'id',
  client_id = 'client_id',
  type = 'type',
  is_vat = 'is_vat',
  active = 'active',
  account_chart_id = 'account_chart_id',
  accounting_period_id = 'accounting_period_id',
}

enum SellsDefaultParameters {
  id = 'id',
  client_id = 'client_id',
  description = 'description',
  active = 'active',
  account_chart_id = 'account_chart_id',
  accounting_period_id = 'accounting_period_id',
}

enum Payments {
  id = 'id',
  date = 'date',
  pv_id = 'pv_id',
  number = 'number',
  total = 'total',
  method = 'method',
  observation = 'observation',
  customer_id = 'customer_id',
  invoice_id = 'invoice_id',
}

enum VatRatePurchase {
  id = 'id',
  receipt_id = 'receipt_id',
  recorded_net = 'recorded_net',
  vat_type_id = 'vat_type_id',
  vat_amount = 'vat_amount',
}

enum VatRateInvoice {
  id = 'id',
  invoice_id = 'invoice_id',
  recorded_net = 'recorded_net',
  vat_type_id = 'vat_type_id',
  vat_amount = 'vat_amount',
}

enum PaymentTypesParameters {
  id = 'id',
  client_id = 'client_id',
  name = 'name',
  active = 'active',
  account_chart_id = 'account_chart_id',
  accounting_period_id = 'accounting_period_id',
}

enum SellPoints {
  id = 'id',
  number = 'number',
  client_id = 'client_id',
  active = 'active',
  account_chart_id = 'account_chart_id',
  accounting_period_id = 'accounting_period_id',
}

enum ProvidersParameters {
  id = 'id',
  provider_id = 'provider_id',
  active = 'active',
  description = 'description',
  account_chart_id = 'account_chart_id',
  accounting_period_id = 'accounting_period_id',
}

enum CustomersParameters {
  id = 'id',
  customer_id = 'provider_id',
  active = 'active',
  description = 'description',
  account_chart_id = 'account_chart_id',
  accounting_period_id = 'accounting_period_id',
}

enum PurchaseEntries {
  id = 'id',
  date = 'date',
  receipt_id = 'receipt_id',
  account_chart_id = 'account_chart_id',
  purchase_period_id = 'purchase_period_id',
  description = 'description',
  debit = 'debit',
  credit = 'credit',
}

enum SellEntries {
  id = 'id',
  date = 'date',
  invoice_id = 'invoice_id',
  account_chart_id = 'account_chart_id',
  purchase_period_id = 'purchase_period_id',
  description = 'description',
  debit = 'debit',
  credit = 'credit',
}

enum PaymentsEntries {
  id = 'id',
  date = 'date',
  payment_id = 'payment_id',
  account_chart_id = 'account_chart_id',
  purchase_period_id = 'purchase_period_id',
  description = 'description',
  debit = 'debit',
  credit = 'credit',
}

enum AccountingEntries {
  id = 'id',
  date = 'date',
  accounting_period_id = 'accounting_period_id',
  description = 'description',
  debit = 'debit',
  credit = 'credit',
  number = 'number',
}

enum AccountingEntriesDetails {
  id = 'id',
  accounting_entry_id = 'accounting_entry_id',
  account_chart_id = 'account_chart_id',
  debit = 'debit',
  credit = 'credit',
}

export enum Tables {
  ADMIN = 'admins',
  AUTH_ADMIN = 'auth_admin',
  ADMIN_PERMISSIONS = 'admin_permissions',
  CLIENTS_PERMISSIONS = 'clients_permissions',
  MODULES = 'modules',
  ACTIVITY = 'activities',
  CLIENTS = 'clients',
  IVA_CONDITIONS = 'iva_conditions',
  INVOICE_TYPES = 'invoice_types',
  IVA_TYPES = 'iva_types',
  AFIP_CRT = 'afip_crt',
  PROVIDERS = 'providers',
  CUSTOMERS = 'customers',
  ACCOUNTING_PERIOD = 'accounting_period',
  ACCOUNT_CHARTS = 'account_charts',
  RECEIPTS = 'receipts',
  VAT_RATES_RECEIPTS = 'vat_rates_receipts',
  VAT_RATES_INVOICES = 'vat_rates_invoices',
  PURCHASE_PERIODS = 'purchase_periods',
  SELL_PERIODS = 'sell_periods',
  PURCHASE_PARAMETERS = 'purchase_parameters',
  SELLS_PARAMETERS = 'sells_parameters',
  SELLS_DEFAULT_PARAMETERS = 'sells_default_parameters',
  PAYMENT_TYPES_PARAMETERS = 'payment_types_parameters',
  POINTS_SELLS_PARAMETERS = 'points_sells_parameters',
  SELL_POINTS = 'sell_points',
  PROVIDERS_PARAMETERS = 'providers_parameters',
  CUSTOMERS_PARAMETERS = 'customers_parameters',
  PURCHASE_ENTRIES = 'purchase_entries',
  SELL_ENTRIES = 'sell_entries',
  PAYMENTS = 'payments',
  PAYMENTS_ENTRIES = 'payments_entries',
  ENTRIES = 'entries',
  ENTRIES_DETAILS = 'entries_details',
  INVOICES = 'invoices',
}

export const Columns = {
  admin: Admin,
  authAdmin: AuthAdm,
  adminPermissions: AdminPermission,
  clientsPermissions: ClientsPermissions,
  modules: Modules,
  activity: Activity,
  clients: Clients,
  ivaConditions: IvaConditions,
  invoiceTypes: InvoiceTypes,
  ivaTypes: IvaTypes,
  afipCrt: AfipCrt,
  providers: Providers,
  accountingPeriod: AccountingPeriod,
  accountCharts: AccountCharts,
  receipts: Receipts,
  purchaseRatesReceipts: PurchaseRatesReceipts,
  purchasePeriods: PurchasesPeriods,
  purchaseParameters: PurchaseParameters,
  vatRatePurchase: VatRatePurchase,
  paymentTypesParameters: PaymentTypesParameters,
  providersParameters: ProvidersParameters,
  purchaseEntries: PurchaseEntries,
  accountingEntries: AccountingEntries,
  accountingEntriesDetails: AccountingEntriesDetails,
  customers: Customers,
  customersParameters: CustomersParameters,
  invoices: Invoices,
  sellPoints: SellPoints,
  sellParameters: SellParameters,
  sellEntries: SellEntries,
  vatRateInvoice: VatRateInvoice,
  sellPeriods: SellPeriods,
  payments: Payments,
  paymentsEntries: PaymentsEntries,
  sellsDefaultParameters: SellsDefaultParameters,
};
