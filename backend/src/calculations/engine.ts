/**
 * Financial planning calculations derived from Ric Edelman's planning methodology.
 * Reference: "Discover the Wealth Within You"
 * All financial math lives here. Services and controllers must never contain formulas.
 */

// ─── Compounding / TVM Formulas ───────────────────────────────────────────────

/** FV = PV × (1 + r)^n */
export function calculateFutureValue(pv: number, annualRate: number, years: number): number {
  return pv * Math.pow(1 + annualRate, years);
}

/** FV of regular savings: FV = PMT × [((1 + r/12)^(n*12) - 1) / (r/12)] */
export function calculateFutureValueOfSavings(monthlyPayment: number, annualRate: number, years: number): number {
  if (annualRate === 0) return monthlyPayment * years * 12;
  const r = annualRate / 12;
  const n = years * 12;
  return monthlyPayment * ((Math.pow(1 + r, n) - 1) / r);
}

/** Goal shortfall: Future Cost − (FV of assets + FV of savings + outside sources) */
export function calculateGoalShortfall(futureCost: number, fvAssets: number, fvSavings: number, outsideSources: number): number {
  return Math.max(0, futureCost - (fvAssets + fvSavings + outsideSources));
}

/** Option A: Required monthly savings to close shortfall on time */
export function calculateRequiredSavings(shortfall: number, annualRate: number, years: number): number {
  if (annualRate === 0) return shortfall / (years * 12);
  const r = annualRate / 12;
  const n = years * 12;
  return shortfall * r / (Math.pow(1 + r, n) - 1);
}

/** Option B: Max supportable present-value goal cost given current savings */
export function calculateSupportableCost(fvAssets: number, fvSavings: number, outsideSources: number, inflationRate: number, years: number): number {
  const totalFunded = fvAssets + fvSavings + outsideSources;
  return totalFunded / Math.pow(1 + inflationRate, years);
}

/** Option C: Additional months needed to close shortfall at current savings rate */
export function calculateDelayMonths(shortfall: number, monthlyPayment: number, annualRate: number): number {
  if (monthlyPayment <= 0) return Infinity;
  const r = annualRate / 12;
  if (r === 0) return Math.ceil(shortfall / monthlyPayment);
  return Math.ceil(Math.log(1 + (shortfall * r) / monthlyPayment) / Math.log(1 + r));
}

/** Inflation-adjusted future cost */
export function calculateInflationAdjustedCost(presentCost: number, inflationRate: number, years: number): number {
  return presentCost * Math.pow(1 + inflationRate, years);
}

/** Years from today until a given year */
export function yearsUntilYear(targetYear: number): number {
  const now = new Date().getFullYear();
  return Math.max(0, targetYear - now);
}

/** Years from today until a date string */
export function yearsUntil(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  return Math.max(0, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

// ─── Emergency Fund ───────────────────────────────────────────────────────────

/** Edelman: 3 months (stable) to 6 months (volatile/dependents) */
export function calculateEmergencyFundTarget(monthlyExpenses: number, jobVolatility: 'low' | 'medium' | 'high', hasDependents: boolean): number {
  let months = 3;
  if (jobVolatility === 'medium') months = 4;
  if (jobVolatility === 'high') months = 6;
  if (hasDependents) months = Math.min(months + 1, 6);
  return monthlyExpenses * months;
}

// ─── Segmentation Engine ─────────────────────────────────────────────────────
/**
 * Derives wealth segment from investable assets + income.
 * Conservative thresholds — no user self-selection.
 */
export function deriveWealthSegment(
  totalInvestableAssets: number,
  annualIncome: number
): 'Mass Market' | 'Mass Affluent' | 'HNI' | 'UHNWI' {
  if (totalInvestableAssets >= 10_000_000) return 'UHNWI';
  if (totalInvestableAssets >= 1_000_000 || annualIncome >= 300_000) return 'HNI';
  if (totalInvestableAssets >= 100_000 || annualIncome >= 75_000) return 'Mass Affluent';
  return 'Mass Market';
}

// ─── Risk Scoring Engine ──────────────────────────────────────────────────────
/**
 * Risk questionnaire scoring based on recognized investor suitability concepts
 * and the Edelman planning methodology.
 *
 * 12 questions, each scored 1-5.
 * Max score: 60 → Aggressive
 * Min score: 12 → Conservative
 */
export const RISK_QUESTIONS: Array<{
  id: string;
  question: string;
  options: Array<{ label: string; score: number }>;
}> = [
  {
    id: 'q1',
    question: 'If your investment portfolio declined 25% in one year, what would you most likely do?',
    options: [
      { label: 'Sell all investments immediately to prevent further losses', score: 1 },
      { label: 'Sell a portion to reduce exposure', score: 2 },
      { label: 'Hold and wait for recovery', score: 3 },
      { label: 'Hold and make no changes', score: 4 },
      { label: 'Buy more — it is an opportunity', score: 5 },
    ],
  },
  {
    id: 'q2',
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve what I have — I cannot afford to lose principal', score: 1 },
      { label: 'Generate stable income with minimal risk', score: 2 },
      { label: 'Balanced growth and income', score: 3 },
      { label: 'Long-term growth with some income', score: 4 },
      { label: 'Maximum long-term growth — income is secondary', score: 5 },
    ],
  },
  {
    id: 'q3',
    question: 'How long until you expect to start withdrawing the bulk of this money?',
    options: [
      { label: 'Within 2 years', score: 1 },
      { label: '2–5 years', score: 2 },
      { label: '5–10 years', score: 3 },
      { label: '10–20 years', score: 4 },
      { label: 'More than 20 years', score: 5 },
    ],
  },
  {
    id: 'q4',
    question: 'How would you describe your experience with investing?',
    options: [
      { label: 'No experience', score: 1 },
      { label: 'Limited — a few basic accounts', score: 2 },
      { label: 'Moderate — stocks, mutual funds, some experience', score: 3 },
      { label: 'Good — I actively manage investments', score: 4 },
      { label: 'Extensive — bonds, options, alternatives, etc.', score: 5 },
    ],
  },
  {
    id: 'q5',
    question: 'Which best describes your income stability?',
    options: [
      { label: 'Uncertain or seasonal income', score: 1 },
      { label: 'Somewhat variable', score: 2 },
      { label: 'Fairly stable salary', score: 3 },
      { label: 'Stable with additional income streams', score: 4 },
      { label: 'Very stable — multiple strong income sources', score: 5 },
    ],
  },
  {
    id: 'q6',
    question: 'What percentage of your monthly income do you save or invest?',
    options: [
      { label: 'Nothing — I spend what I earn', score: 1 },
      { label: 'Less than 5%', score: 2 },
      { label: '5–15%', score: 3 },
      { label: '15–25%', score: 4 },
      { label: 'More than 25%', score: 5 },
    ],
  },
  {
    id: 'q7',
    question: 'You have 6 months of expenses saved as an emergency fund. How do you feel?',
    options: [
      { label: 'I do not have this buffer — this concerns me greatly', score: 1 },
      { label: 'I have less than this and it worries me', score: 2 },
      { label: 'I have roughly this amount — I feel comfortable', score: 3 },
      { label: 'I have this plus more — I feel secure', score: 4 },
      { label: 'I have significantly more — I feel very secure', score: 5 },
    ],
  },
  {
    id: 'q8',
    question: 'Which portfolio scenario best matches your comfort level?',
    options: [
      { label: 'Best: +5%, Worst: -2% — Stability first', score: 1 },
      { label: 'Best: +10%, Worst: -5% — Low volatility', score: 2 },
      { label: 'Best: +15%, Worst: -10% — Moderate balance', score: 3 },
      { label: 'Best: +25%, Worst: -20% — Growth oriented', score: 4 },
      { label: 'Best: +40%, Worst: -35% — Maximum growth', score: 5 },
    ],
  },
  {
    id: 'q9',
    question: 'How do you feel about borrowing money to invest (leverage)?',
    options: [
      { label: 'Never — debt for investing is irresponsible', score: 1 },
      { label: 'Only in very conservative situations', score: 2 },
      { label: 'Neutral — depends on the opportunity', score: 3 },
      { label: 'Open to it if returns clearly outweigh cost', score: 4 },
      { label: 'A legitimate strategy to amplify returns', score: 5 },
    ],
  },
  {
    id: 'q10',
    question: 'How do you typically react to financial news about a market crash?',
    options: [
      { label: 'I panic — I feel the urge to sell immediately', score: 1 },
      { label: 'I feel anxious and reduce exposure', score: 2 },
      { label: 'I stay calm and monitor the situation', score: 3 },
      { label: 'I see it as a possible buying opportunity', score: 4 },
      { label: 'I actively look to invest more during crashes', score: 5 },
    ],
  },
  {
    id: 'q11',
    question: 'What best describes your current life stage and obligations?',
    options: [
      { label: 'Supporting dependents with limited savings — high obligations', score: 1 },
      { label: 'Married with children — moderate obligations', score: 2 },
      { label: 'Dual income, no children — moderate savings', score: 3 },
      { label: 'Mid-career, financially stable, children becoming independent', score: 4 },
      { label: 'Near or in retirement — wealth accumulated, low obligations', score: 5 },
    ],
  },
  {
    id: 'q12',
    question: 'Over a 10-year period, you would prefer an investment that:',
    options: [
      { label: 'Grows slowly but never loses value', score: 1 },
      { label: 'Has mostly small gains with rare small losses', score: 2 },
      { label: 'Has moderate gains and moderate losses', score: 3 },
      { label: 'Has large gains some years and large losses in others', score: 4 },
      { label: 'May be volatile year-to-year but maximizes long-run return', score: 5 },
    ],
  },
];

/** Maps total risk score to a risk profile label */
export function scoreToRiskProfile(score: number): 'Conservative' | 'Moderately Conservative' | 'Balanced' | 'Growth' | 'Aggressive' {
  if (score <= 20) return 'Conservative';
  if (score <= 30) return 'Moderately Conservative';
  if (score <= 42) return 'Balanced';
  if (score <= 52) return 'Growth';
  return 'Aggressive';
}

// ─── Portfolio Drift ──────────────────────────────────────────────────────────
export function inferPortfolioDrift(holdings: { category: string; currentValue: number }[], riskProfile: string): number {
  const totalAssets = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  if (totalAssets === 0) return 0;

  // Derive target equity percentage based on risk profile (Edelman standard heuristics)
  let targetEquityPct = 0.50; // default Balanced
  if (riskProfile === 'Aggressive') targetEquityPct = 0.85;
  if (riskProfile === 'Growth') targetEquityPct = 0.70;
  if (riskProfile === 'Balanced') targetEquityPct = 0.50;
  if (riskProfile === 'Moderately Conservative') targetEquityPct = 0.35;
  if (riskProfile === 'Conservative') targetEquityPct = 0.20;

  // Calculate actual equity percentage (Assuming Stocks/Mutual Funds are Equity)
  const equityCategories = ['Stocks', 'Mutual Funds', 'Equity', 'ETF'];
  const actualEquity = holdings
    .filter(h => equityCategories.some(cat => h.category.toLowerCase().includes(cat.toLowerCase())))
    .reduce((sum, h) => sum + h.currentValue, 0);
  
  const actualEquityPct = actualEquity / totalAssets;

  return Math.abs(actualEquityPct - targetEquityPct);
}

// ─── Wealth Health Score (7 Pillars) ─────────────────────────────────────────
export interface WHSInputs {
  liquidCashBalance: number;
  emergencyFundTarget: number;
  highInterestDebt: number;
  totalDebt: number;
  totalAssets: number;
  monthlyNetIncome: number;
  monthlySavings: number;
  savingsRate: number;
  targetSavingsRate: number;
  portfolioDrift: number;
  retirementReadinessRatio: number;  // 0–1
  goalFundingRatio: number;           // 0–1
  disabilityCoverageRatio: number;
  lifeCoverageRatio: number;
  hasLTC: boolean;
  age: number;
  hasWill: boolean;
  hasPOA: boolean;
  hasHCProxy: boolean;
}

export function calculateWHS(inputs: WHSInputs): {
  score: number;
  pillars: Record<string, number>;
  metrics: {
    net_worth: number;
    monthly_savings: number;
    savings_rate: number;
    emergency_fund_coverage: number;
    retirement_readiness: number;
    goal_funding_status: number;
    insurance_adequacy: number;
    debt_ratio: number;
  };
} {
  const netWorth = inputs.totalAssets - inputs.totalDebt;
  const emergencyMonths = inputs.emergencyFundTarget > 0
    ? inputs.liquidCashBalance / (inputs.emergencyFundTarget / 6)
    : 6;

  // Pillar 1: Emergency Fund (20 pts)
  const efRatio = Math.min(1, inputs.liquidCashBalance / Math.max(1, inputs.emergencyFundTarget));
  const p1 = Math.round(efRatio * 20);

  // Pillar 2: Debt Management (20 pts)
  const debtRatio = inputs.totalAssets > 0 ? inputs.totalDebt / inputs.totalAssets : 1;
  const highDebtPenalty = Math.min(10, (inputs.highInterestDebt / Math.max(1, inputs.monthlyNetIncome)) * 5);
  const debtRatioPenalty = Math.min(10, debtRatio * 10);
  const p2 = Math.max(0, Math.round(20 - highDebtPenalty - debtRatioPenalty));

  // Pillar 3: Savings Rate (15 pts)
  const srRatio = Math.min(1, inputs.savingsRate / Math.max(0.01, inputs.targetSavingsRate));
  const p3 = Math.round(srRatio * 15);

  // Pillar 4: Portfolio Drift (15 pts) — placeholder
  const driftPenalty = Math.min(15, inputs.portfolioDrift * 100);
  const p4 = Math.max(0, Math.round(15 - driftPenalty));

  // Pillar 5: Retirement Readiness (15 pts)
  const p5 = Math.round(Math.min(1, inputs.retirementReadinessRatio) * 15);

  // Pillar 6: Insurance Protection (10 pts)
  const disScore = Math.min(1, inputs.disabilityCoverageRatio) * 3;
  const lifeScore = Math.min(1, inputs.lifeCoverageRatio) * 4;
  const ltcScore = inputs.age >= 50 && inputs.hasLTC ? 3 : inputs.age < 50 ? 3 : 0;
  const p6 = Math.round(disScore + lifeScore + ltcScore);

  // Pillar 7: Estate Planning (5 pts)
  const estateCount = [inputs.hasWill, inputs.hasPOA, inputs.hasHCProxy].filter(Boolean).length;
  const p7 = Math.round((estateCount / 3) * 5);

  const rawScore = p1 + p2 + p3 + p4 + p5 + p6 + p7;
  const score = Math.min(100, Math.max(0, rawScore));

  return {
    score,
    pillars: {
      emergency_fund: Math.round((p1 / 20) * 100),
      debt_mgmt: Math.round((p2 / 20) * 100),
      savings_rate: Math.round((p3 / 15) * 100),
      portfolio_drift: Math.round((p4 / 15) * 100),
      retirement_readiness: Math.round((p5 / 15) * 100),
      insurance_protection: Math.round((p6 / 10) * 100),
      estate_planning: Math.round((p7 / 5) * 100),
    },
    metrics: {
      net_worth: Math.round(netWorth),
      monthly_savings: Math.round(inputs.monthlySavings),
      savings_rate: Math.round(inputs.savingsRate * 100),
      emergency_fund_coverage: Math.round(emergencyMonths * 10) / 10,
      retirement_readiness: Math.round(inputs.retirementReadinessRatio * 100),
      goal_funding_status: Math.round(inputs.goalFundingRatio * 100),
      insurance_adequacy: Math.round(((inputs.disabilityCoverageRatio + inputs.lifeCoverageRatio) / 2) * 100),
      debt_ratio: Math.round(debtRatio * 100),
    },
  };
}

export function getWHSCategory(score: number): 'VULNERABLE' | 'CAUTION' | 'HEALTHY' | 'EXCELLENT' {
  if (score < 40) return 'VULNERABLE';
  if (score < 65) return 'CAUTION';
  if (score < 85) return 'HEALTHY';
  return 'EXCELLENT';
}

// ─── Investment Management Analytics ─────────────────────────────────────────
// Phase 1: Investment Management Module calculations
// Per the research roadmap (Global Wealth Mgmt Master Framework)

export interface PeriodReturn {
  startValue: number;
  endValue: number;
  cashFlows?: number; // net external cash flows in/out during period
}

/**
 * Time-Weighted Return (TWR) — eliminates distortion from external cash flows.
 * Formula: TWR = [(1 + R1) × (1 + R2) × … × (1 + Rn)] − 1
 * Industry standard for evaluating portfolio manager performance.
 */
export function calculateTWR(periods: PeriodReturn[]): number {
  if (periods.length === 0) return 0;
  const productOfReturns = periods.reduce((acc, period) => {
    const denominator = period.startValue + Math.max(0, period.cashFlows ?? 0);
    if (denominator === 0) return acc;
    const periodReturn = (period.endValue - denominator) / denominator;
    return acc * (1 + periodReturn);
  }, 1);
  return productOfReturns - 1;
}

/**
 * Money-Weighted Return (MWR / XIRR approximation via Newton-Raphson).
 * Accounts for the timing and magnitude of cash flows.
 * More representative of the actual investor experience.
 * @param cashFlows - array of { amount, date } where initial investment is negative
 */
export function calculateMWR(
  cashFlows: Array<{ amount: number; date: Date }>,
  maxIterations = 100,
  tolerance = 1e-6
): number {
  if (cashFlows.length < 2) return 0;
  const dates = cashFlows.map(cf => cf.date.getTime());
  const minDate = Math.min(...dates);
  const years = cashFlows.map(cf => (cf.date.getTime() - minDate) / (365.25 * 24 * 60 * 60 * 1000));
  const amounts = cashFlows.map(cf => cf.amount);

  let rate = 0.1; // initial guess: 10%
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let j = 0; j < amounts.length; j++) {
      const factor = Math.pow(1 + rate, years[j]);
      npv += amounts[j] / factor;
      dnpv += -years[j] * amounts[j] / (factor * (1 + rate));
    }
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }
  return rate;
}

/**
 * Annualized return from a cumulative return over N years.
 * Formula: Annualized = (1 + totalReturn)^(1/years) − 1
 */
export function annualizeReturn(totalReturn: number, years: number): number {
  if (years <= 0) return 0;
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Volatility (Standard Deviation of periodic returns).
 * Used to measure investment risk; annualized from monthly data × √12.
 */
export function calculateVolatility(periodicReturns: number[], periodsPerYear = 12): number {
  if (periodicReturns.length < 2) return 0;
  const mean = periodicReturns.reduce((a, b) => a + b, 0) / periodicReturns.length;
  const variance = periodicReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (periodicReturns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear);
}

/**
 * Sharpe Ratio — risk-adjusted return.
 * Formula: (Portfolio Return − Risk-Free Rate) / Portfolio Volatility
 * A ratio > 1 is generally considered good.
 */
export function calculateSharpeRatio(portfolioReturn: number, riskFreeRate: number, volatility: number): number {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
}

/**
 * Beta — portfolio sensitivity to market movements.
 * Formula: β = Cov(Portfolio, Market) / Var(Market)
 * β > 1: more volatile than market; β < 1: less volatile.
 */
export function calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length < 2) return 1;
  const n = portfolioReturns.length;
  const meanP = portfolioReturns.reduce((a, b) => a + b, 0) / n;
  const meanM = marketReturns.reduce((a, b) => a + b, 0) / n;
  const covariance = portfolioReturns.reduce((acc, rp, i) => acc + (rp - meanP) * (marketReturns[i] - meanM), 0) / (n - 1);
  const marketVariance = marketReturns.reduce((acc, rm) => acc + Math.pow(rm - meanM, 2), 0) / (n - 1);
  return marketVariance === 0 ? 1 : covariance / marketVariance;
}

/**
 * Alpha — excess return vs benchmark adjusted for Beta.
 * Formula: α = Portfolio Return − (Risk-Free Rate + Beta × (Market Return − Risk-Free Rate))
 * Positive alpha means the portfolio outperformed its risk-adjusted expectation.
 */
export function calculateAlpha(
  portfolioReturn: number,
  benchmarkReturn: number,
  riskFreeRate: number,
  beta: number
): number {
  return portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
}

/**
 * Portfolio Drift — how much the actual allocation deviates from the target.
 * Returns total absolute drift across all asset classes.
 * A drift > 5% triggers a rebalancing alert per the research.
 */
export function calculatePortfolioDrift(
  currentAllocation: Record<string, number>,  // { assetClass: % as decimal }
  targetAllocation: Record<string, number>
): { totalDrift: number; driftByAsset: Record<string, number> } {
  const driftByAsset: Record<string, number> = {};
  let totalDrift = 0;
  const allKeys = new Set([...Object.keys(currentAllocation), ...Object.keys(targetAllocation)]);
  for (const key of allKeys) {
    const current = currentAllocation[key] ?? 0;
    const target = targetAllocation[key] ?? 0;
    const drift = Math.abs(current - target);
    driftByAsset[key] = drift;
    totalDrift += drift;
  }
  return { totalDrift, driftByAsset };
}

/**
 * Asset allocation as % of total portfolio value.
 * Groups holdings by category and computes weight.
 */
export function computeAssetAllocation(
  holdings: Array<{ category: string; current_value: number }>
): Record<string, number> {
  const total = holdings.reduce((s, h) => s + h.current_value, 0);
  if (total === 0) return {};
  const grouped: Record<string, number> = {};
  for (const h of holdings) {
    grouped[h.category] = (grouped[h.category] ?? 0) + h.current_value;
  }
  const allocation: Record<string, number> = {};
  for (const [cat, val] of Object.entries(grouped)) {
    allocation[cat] = val / total;
  }
  return allocation;
}

/** Risk-profile-based target asset allocations (Edelman "Pound Cake" approach) */
export const TARGET_ALLOCATIONS: Record<string, Record<string, number>> = {
  Conservative: { Bonds: 0.50, Cash: 0.15, 'Mutual Funds': 0.20, Stocks: 0.10, Gold: 0.05 },
  'Moderately Conservative': { Bonds: 0.35, 'Mutual Funds': 0.30, Stocks: 0.20, Cash: 0.10, Gold: 0.05 },
  Balanced: { Stocks: 0.40, 'Mutual Funds': 0.30, Bonds: 0.20, Cash: 0.05, Gold: 0.05 },
  Growth: { Stocks: 0.55, 'Mutual Funds': 0.25, Bonds: 0.10, Cash: 0.05, Gold: 0.05 },
  Aggressive: { Stocks: 0.70, 'Mutual Funds': 0.20, Bonds: 0.05, Cash: 0.03, Gold: 0.02 },
};
