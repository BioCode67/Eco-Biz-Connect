// 백엔드 API 응답과 매칭되는 타입 정의.

export type Role = "MERCHANT" | "INVESTOR" | "ADMIN";

export interface User {
  id: number;
  email: string;
  role: Role;
  verification_status: string;
  business_reg_no?: string | null;
  store_name?: string | null;
  store_address?: string | null;
  business_category?: string | null;
  esg_score?: string | null;
  wallet_address?: string | null;
  kyc_status?: string | null;
  total_invested?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface BusinessData {
  id: number;
  merchant_id: number;
  file_name: string;
  file_size: number;
  processing_status: string;
  created_at: string;
}

export interface AnalysisReport {
  id: number;
  business_data_id: number;
  merchant_id: number;
  summary: string;
  sales_forecast: { unit: string; next_3_months: number[] };
  cost_optimization_tips: string[];
  district_comparison: { your_percentile: number; district_avg_sales: number; note: string };
  created_at: string;
}

export interface ESGScore {
  id: number;
  merchant_id: number;
  business_data_id: number;
  env_score: string;
  social_score: string;
  governance_score: string;
  composite_score: string;
  score_grade: string;
  on_chain_tx_hash: string | null;
  created_at: string;
}

export interface MatchedProduct {
  id: number;
  product_code: string;
  bank_name: string;
  product_name: string;
  base_rate: string;
  preferential_rate: number;
  max_amount: number;
  term_months: number;
  min_esg_grade: string;
}

export interface LoanApplication {
  id: number;
  merchant_id: number;
  financial_product_id: number;
  amount: number;
  applied_rate: string;
  term_months: number;
  status: string;
  decision_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface STOAsset {
  id: number;
  issuer_id: number;
  asset_type: "SOLAR" | "WIND" | "FOREST" | "HYDRO";
  name: string;
  description: string | null;
  total_token_supply: number;
  remaining_tokens: number;
  token_price: string;
  contract_address: string | null;
  status: string;
  created_at: string;
}

export interface Holding {
  sto_asset_id: number;
  asset_name: string;
  quantity: number;
  total_paid: string;
  current_value: string;
  dividends_received: string;
}

export interface Portfolio {
  total_invested: string;
  total_current_value: string;
  total_dividends_received: string;
  holdings: Holding[];
}

export interface Dividend {
  id: number;
  sto_asset_id: number;
  asset_name: string;
  per_token_amount: string;
  my_quantity: number;
  my_dividend: string;
  distribution_date: string;
  on_chain_tx_hash: string | null;
}

export interface TransactionItem {
  type: string;
  ref_id: number;
  description: string;
  amount: string;
  status: string | null;
  timestamp: string;
}

export interface TransactionPage {
  items: TransactionItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface SystemMetrics {
  subsystems: Record<string, Record<string, unknown>>;
  totals: Record<string, number>;
}

export interface AdminUser {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface AuditLog {
  id: number;
  actor_id: number | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}
