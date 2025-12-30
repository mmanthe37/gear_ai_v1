/**
 * Gear AI CoPilot - Financial Type Definitions
 * 
 * Data models for loan/lease tracking and vehicle valuation
 */

// Type alias for encrypted strings (base64-encoded BYTEA from database)
export type EncryptedString = string;

export interface FinancialAccount {
  account_id: string;
  vehicle_id: string;
  type: 'loan' | 'lease' | 'cash';
  lender_name?: string;
  account_number_encrypted?: EncryptedString; // Base64-encoded encrypted data from pgcrypto
  encryption_key_id?: string;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  term_months?: number;
  interest_rate?: number; // APR as decimal (e.g., 0.0549 for 5.49%)
  money_factor?: number; // For leases
  residual_value?: number; // For leases
  monthly_payment?: number;
  down_payment?: number;
  principal_amount?: number;
  current_balance?: number;
  total_paid?: number;
  payoff_date?: string; // ISO date string
  status: 'active' | 'paid_off' | 'refinanced' | 'defaulted';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface LoanDetails {
  principal: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  monthly_payment: number;
  total_interest: number;
  total_paid: number;
  current_balance: number;
  payments_made: number;
  payments_remaining: number;
  payoff_date: string;
}

export interface LeaseDetails {
  monthly_payment: number;
  term_months: number;
  money_factor: number;
  residual_value: number;
  start_date: string;
  end_date: string;
  miles_allowed_annual: number;
  current_mileage: number;
  overage_charge_per_mile: number;
  projected_overage_cost: number;
  buyout_value: number; // Current residual + remaining payments
  market_value: number; // Current market value of vehicle
  equity: number; // market_value - buyout_value
}

export interface AmortizationSchedule {
  payment_number: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulative_interest: number;
  cumulative_principal: number;
}

export interface VehicleValuation {
  valuation_id: string;
  vehicle_id: string;
  current_market_value: number;
  trade_in_value: number;
  private_party_value: number;
  dealer_retail_value: number;
  wholesale_value: number;
  confidence_level: number; // 0-1
  data_source: string; // e.g., "MarketCheck + Black Book"
  valuation_date: string;
  mileage_at_valuation: number;
  condition_grade?: 'excellent' | 'good' | 'fair' | 'poor';
  depreciation_rate_annual: number; // Percentage per year
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ValuationHistory {
  vehicle_id: string;
  valuations: VehicleValuation[];
  depreciation_chart: {
    date: string;
    value: number;
  }[];
  total_depreciation: number;
  depreciation_percentage: number;
}

export interface FinancialSummary {
  vehicle_id: string;
  purchase_price: number;
  current_value: number;
  total_depreciation: number;
  loan_balance?: number;
  equity: number; // current_value - loan_balance
  total_maintenance_cost: number;
  total_ownership_cost: number; // depreciation + maintenance + interest
  monthly_ownership_cost: number;
  ownership_months: number;
}

export interface PayoffAnalysis {
  current_balance: number;
  current_monthly_payment: number;
  interest_rate: number;
  months_remaining: number;
  total_interest_remaining: number;
  early_payoff_scenarios: {
    extra_monthly: number; // Additional payment amount
    new_payoff_months: number;
    interest_saved: number;
    total_saved: number;
  }[];
}

export interface LeaseVsBuyAnalysis {
  lease: {
    monthly_payment: number;
    total_cost_3_years: number;
    equity_at_end: number;
  };
  buy: {
    monthly_payment: number;
    total_cost_3_years: number;
    equity_at_end: number;
  };
  break_even_months: number;
  recommendation: 'lease' | 'buy';
  savings: number;
}

export type FinancingType = 'loan' | 'lease' | 'cash';

export const FinancingTypes: Record<FinancingType, string> = {
  loan: 'Auto Loan',
  lease: 'Lease',
  cash: 'Cash Purchase',
};

export interface FinancialFormData {
  type: FinancingType;
  lender_name?: string;
  start_date: string;
  term_months?: number;
  interest_rate?: number;
  monthly_payment?: number;
  down_payment?: number;
  principal_amount?: number;
  residual_value?: number;
  money_factor?: number;
}
