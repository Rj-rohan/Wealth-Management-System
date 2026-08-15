// ─── Shared Frontend TypeScript types for PWM ────────────────────────────────

export type RiskProfile = 'Conservative' | 'Moderately Conservative' | 'Balanced' | 'Growth' | 'Aggressive';
export type WHSCategory = 'VULNERABLE' | 'CAUTION' | 'HEALTHY' | 'EXCELLENT';
export type UserRole = 'client' | 'advisor';
export type AlertPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'Active' | 'Dismissed' | 'Snoozed' | 'Addressed';
export type GoalCategory = 'Retirement' | 'Education' | 'Purchase' | 'Travel' | 'Business' | 'Wealth Creation' | 'Emergency Fund' | 'General Savings';
export type WealthSegment = 'Mass Market' | 'Mass Affluent' | 'HNI' | 'UHNWI';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  onboarding_complete: boolean;
  segment: WealthSegment;
  display_currency?: string;
  token?: string;
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
  score_emergency_fund: number;
  score_debt_mgmt: number;
  score_savings_rate: number;
  score_portfolio_drift: number;
  score_retirement_readiness: number;
  score_insurance_protection: number;
  score_estate_planning: number;
  net_worth: number;
  monthly_savings: number;
  savings_rate: number;
  emergency_fund_coverage: number;
  retirement_readiness: number;
  goal_funding_status: number;
  insurance_adequacy: number;
  debt_ratio: number;
  updated_at: string;
  disclaimer?: string;
}

export interface NetWorthHistory {
  date: string;
  net_worth: number;
}

export interface RiskQuestion {
  id: string;
  question: string;
  options: Array<{ label: string; score: number }>;
}

export interface FinancialSnapshot {
  segment: WealthSegment;
  risk_profile: RiskProfile;
  whs: WHSSnapshot & {
    pillars: Record<string, number>;
  };
  top_risks: Array<{
    priority: AlertPriority;
    category: string;
    message: string;
  }>;
  assumptions: {
    inflation_rate: number;
    expected_return: number;
    retirement_inflation: number;
    education_inflation: number;
  };
  disclaimer: string;
}

// ─── Investment Management Module (Phase 1) ────────────────────────────────────

export interface AssetClassBreakdown {
  category: string;
  value: number;
  percentage: number;
  count: number;
}

export interface InstitutionBreakdown {
  institution_id: string;
  institution_name: string;
  institution_type: string;
  total_value: number;
  account_count: number;
}

export interface PortfolioSummary {
  user_id: string;
  total_portfolio_value: number;
  total_liabilities: number;
  net_worth: number;
  holdings_count: number;
  account_count: number;
  institution_count: number;
  risk_profile: RiskProfile;
  by_asset_class: AssetClassBreakdown[];
  by_institution: InstitutionBreakdown[];
  disclaimer: string;
}

export interface MonthlyChartPoint {
  month: string;
  portfolio_value: number;
  benchmark_value: number;
  portfolio_return_pct: number;
}

export interface PortfolioPerformance {
  user_id: string;
  risk_profile: RiskProfile;
  period: string;
  twr_pct: number;
  annualized_return_pct: number;
  benchmark_return_pct: number;
  outperformance_pct: number;
  volatility_pct: number;
  sharpe_ratio: number;
  beta: number;
  alpha_pct: number;
  risk_free_rate_pct: number;
  monthly_chart: MonthlyChartPoint[];
  disclaimer: string;
}

export interface AllocationBreakdownItem {
  category: string;
  current_pct: number;
  target_pct: number;
  drift_pct: number;
  current_value: number;
  needs_rebalance: boolean;
}

export interface AssetAllocation {
  user_id: string;
  risk_profile: RiskProfile;
  total_portfolio_value: number;
  total_drift_pct: number;
  needs_rebalance: boolean;
  breakdown: AllocationBreakdownItem[];
  disclaimer: string;
}

export interface RebalancingAlert {
  category: string;
  action: 'REDUCE' | 'INCREASE';
  current_pct: number;
  target_pct: number;
  drift_pct: number;
  amount_to_move: number;
  message: string;
}

export interface RebalancingAlerts {
  user_id: string;
  risk_profile: RiskProfile;
  needs_rebalance: boolean;
  total_drift_pct: number;
  alert_count: number;
  alerts: RebalancingAlert[];
  disclaimer: string;
}

// ─── AI Mock Services (Modules 1.1, 1.2, 1.3) ──────────────────────────────────

export interface GoalCoachExplanation {
  summary: string;
  situation?: 'on_track' | 'small_shortfall' | 'large_shortfall' | 'fully_funded' | 'missing_data';
  context?: string;
  strategies?: string[];
  tradeoffs?: string[];
  action?: string;
  optimization?: string;
  missing?: string[];
}

export interface GoalChatContext {
  goalId: string;
  goalName: string;
  category: string;
  targetAmount: number;
  targetYear: number;
  alreadySaved: number;
  monthlyContribution: number;
  shortfall: number;
  fundedPercentage: number;
  situation?: string;
  optionA_monthlySavings?: number;
  optionB_presentCost?: number;
  optionC_delayMonths?: number;
  coachSummary?: string;
}

export interface AIGoalCoachMessage {
  goal_id: string;
  explanation: GoalCoachExplanation;
  disclaimer: string;
}

export interface AIRetirementCoachMessage {
  user_id: string;
  sections: Array<{ title: string; content: string }>;
  disclaimer: string;
}

export interface AIRecommendationExplanation {
  recommendation_id: string;
  explanation: {
    issue: string;
    matters: string;
    action: string;
  };
  disclaimer: string;
}

