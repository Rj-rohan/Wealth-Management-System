// Shared TypeScript types for the PWM backend
// These match the OpenAPI contract schemas in backend/api_contracts.md

export type RiskProfile = 'Conservative' | 'Moderately Conservative' | 'Balanced' | 'Growth' | 'Aggressive';
export type JobVolatility = 'low' | 'medium' | 'high';
export type WHSCategory = 'VULNERABLE' | 'CAUTION' | 'HEALTHY' | 'EXCELLENT';
export type UserRole = 'client' | 'advisor';
export type AlertPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'Active' | 'Dismissed' | 'Snoozed' | 'Addressed';
export type GoalCategory = 'Retirement' | 'Education' | 'Purchase' | 'Travel' | 'Business' | 'Wealth Creation' | 'Emergency Fund' | 'General Savings';
export type WealthSegment = 'Mass Market' | 'Mass Affluent' | 'HNI' | 'UHNWI';

export interface User {
  id: string;
  email: string;
  password_hash: string; // plain text for prototype only
  name: string;
  role: UserRole;
  onboarding_complete: boolean;
  segment: WealthSegment;
}

export interface ClientProfile {
  user_id: string;
  age: number;
  risk_profile: RiskProfile;
  display_currency: string;
  has_will?: boolean;
  has_poa?: boolean;
  has_hc_proxy?: boolean;
}

export interface HouseholdMember {
  id: string;
  user_id: string;
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Dependent';
  name: string;
  dob: string;
}

export interface HouseholdProfile {
  user_id: string;
  marital_status: string;
  occupation: string;
  dependents: HouseholdMember[];
}

export interface IncomeProfile {
  user_id: string;
  salary: number;
  business: number;
  rental: number;
  other: number;
}

export interface Institution {
  id: string;
  user_id: string;
  name: string;
  type: string;
}

export interface Account {
  id: string;
  institution_id: string;
  user_id: string;
  name: string;
  type: 'Checking' | 'Savings' | 'Demat' | 'Brokerage' | 'Retirement' | 'Other';
}

export interface Holding {
  id: string;
  account_id: string;
  user_id: string;
  name: string;
  category: 'Cash' | 'Stocks' | 'Mutual Funds' | 'Gold' | 'Real Estate' | 'EPF' | 'PPF' | 'NPS' | 'Bonds' | 'Crypto' | 'Fixed Deposits' | 'Other';
  current_value: number;
  is_liquid: boolean;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  category: 'Home Loan' | 'Education Loan' | 'Vehicle Loan' | 'Credit Card' | 'Other';
  outstanding_balance: number;
  interest_rate: number;
  monthly_payment: number;
}

export interface InsuranceProfile {
  user_id: string;
  life_coverage: number;
  health_coverage: number;
  disability_coverage_monthly: number;
  has_long_term_care: boolean;
}

export interface Assumptions {
  user_id: string;
  inflation_rate: number;
  expected_return: number;
  retirement_inflation: number;
  education_inflation: number;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  category: GoalCategory;
  priority: 'High' | 'Medium' | 'Low';
  target_amount: number;
  target_year: number;
  already_saved: number;
  monthly_contribution: number;
  shortfall: number;
  created_at: string;
  updated_at: string;
}

export interface RecommendationAlert {
  id: string;
  user_id: string;
  category: string;
  priority: AlertPriority;
  alert_message: string;
  reason: string;
  expected_benefit: string;
  action: string;
  related_goal_id?: string;
  status: AlertStatus;
  created_at: string;
}

export interface WHSSnapshot {
  user_id: string;
  score: number;
  category: WHSCategory;
  net_worth: number;
  monthly_savings: number;
  savings_rate: number;
  emergency_fund_coverage: number;
  retirement_readiness: number;
  goal_funding_status: number;
  insurance_adequacy: number;
  debt_ratio: number;
  updated_at: string;
}

export interface NetWorthHistory {
  date: string;
  net_worth: number;
}
