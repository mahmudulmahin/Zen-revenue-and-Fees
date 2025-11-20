export interface SettlementReport {
  merchant_id: string;
  shop_id: string;
  terminal_id: string;
  transaction_id: string;
  parent_transaction_id: string;
  merchant_transaction_id: string;
  created_at: string | null;
  accepted_at: string | null;
  transaction_type: string;
  transaction_amount: number;
  transaction_currency: string;
  authorization_amount: number;
  authorization_currency: string;
  stl_amount: number;
  stl_currency: string;
  stl_date: string;
  exchange_rate: number;
  secure_deposit_amount: number;
  secure_deposit_currency: string;
  secure_deposit_release_date: string;
  'if++': string;
  transaction_fee: number;
  interchange_fee: number;
  card_scheme_fee: number;
  cashback_fee: string;
  authorization_fee: string;
  authorization_fee_currency: string;
  transaction_region: string;
  customer_country: string;
  card_country: string;
  payment_method: string;
  payment_channel: string;
  card_type: string;
  card_organisation: string;
  card_product: string;
  card_short_pan: string;
  comment: string;
}

export interface AuthorizationReport {
  merchant_id: string;
  shop_id: string;
  terminal_id: string;
  mcc: string;
  transaction_id: string;
  parent_transaction_id: string;
  merchant_transaction_id: string;
  created_at: string | null;
  transaction_state: string;
  transaction_type: string;
  reject_code: string;
  transaction_amount: number;
  transaction_currency: string;
  authorization_amount: number;
  authorization_currency: string;
  customer_country: string;
  payment_method: string;
  payment_channel: string;
  card_organisation: string;
  card_short_pan: string;
  comment: string;
}

export interface DashboardMetrics {
  date: string;
  country: string;
  paymentChannel: string;
  revenue: number;
  fees: number;
  approvalRatio: number;
  totalTransactions: number;
  acceptedTransactions: number;
}

export type PaymentChannel = 'Apple Pay' | 'Google Pay' | 'Card';
export type Timezone = 'GMT+0' | 'GMT+6';
export type FeeComponent = 'transaction_fee' | 'interchange_fee' | 'card_scheme_fee' | 'secure_deposit_amount';