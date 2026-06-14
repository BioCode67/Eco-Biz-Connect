// 백엔드 API 응답 타입(웹과 동일 스키마).

export type Role = "MERCHANT" | "INVESTOR" | "ADMIN";

export interface User {
  id: number;
  email: string;
  role: Role;
  verification_status: string;
  store_name?: string | null;
  esg_score?: string | null;
  kyc_status?: string | null;
  total_invested?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ESGScore {
  id: number;
  env_score: string;
  social_score: string;
  governance_score: string;
  composite_score: string;
  score_grade: string;
  on_chain_tx_hash: string | null;
  created_at?: string;
}

export interface AnalysisReport {
  id: number;
  summary: string;
  sales_forecast: { unit: string; labels?: string[]; next_3_months: number[]; confidence_lower?: number[]; confidence_upper?: number[]; confidence_level?: number; method?: string };
  cost_optimization_tips: { title: string; detail: string; impact: string }[];
  district_comparison?: {
    your_percentile: number;
    district_avg_sales?: number;
    your_sales?: number;
    metrics?: Record<string, number>;
    note?: string;
  };
  profit?: {
    total_revenue: number;
    total_expense: number;
    operating_profit: number;
    profit_margin: number;
    has_expense: boolean;
    expense_breakdown?: { label: string; amount: number; ratio: number }[];
  } | null;
}

export interface AdminStats {
  merchants: number;
  investors: number;
  total_sto: number;
  onchain_records: number;
  total_co2_offset?: number;
  tx_volume_7d: { label: string; amount: number }[];
}

export interface BusinessData {
  id: number;
  file_name: string;
  processing_status: string;
}

export interface MatchedProduct {
  id: number;
  bank_name: string;
  product_name: string;
  base_rate: string;
  preferential_rate: number;
  max_amount: number;
  term_months: number;
}

export interface LoanApplication {
  id: number;
  amount: number;
  applied_rate: string;
  term_months: number;
  status: string;
  decision_reason?: string | null;
}

export interface STOAsset {
  id: number;
  asset_type: "SOLAR" | "WIND" | "FOREST" | "HYDRO";
  name: string;
  description: string | null;
  total_token_supply: number;
  remaining_tokens: number;
  token_price: string;
  expected_yield: string;
  co2_offset_per_year: number;
  location: string | null;
  installed_capacity_mw: string | null;
  dividend_period_months: number;
  contract_address: string | null;
  status: string;
}

export interface UpcomingDividend {
  sto_asset_id: number;
  asset_name: string;
  next_distribution_date: string;
  estimated_amount: string;
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
  total_return_pct: number;
  holdings: Holding[];
  upcoming_dividends: UpcomingDividend[];
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
  on_chain_tx_hash?: string | null;
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
