/**
 * Service layer — business logic and orchestration.
 * Calls repositories for data and calculation/recommendation engines for math.
 * Controllers must never contain business logic.
 * Repositories must never contain business logic.
 */
import * as repo from '../repositories';
import {
  calculateWHS, getWHSCategory, calculateEmergencyFundTarget, inferPortfolioDrift,
  calculateInflationAdjustedCost, calculateGoalShortfall,
  calculateFutureValue, calculateFutureValueOfSavings,
  calculateRequiredSavings, calculateSupportableCost, calculateDelayMonths,
  yearsUntilYear, deriveWealthSegment, scoreToRiskProfile, RISK_QUESTIONS,
  calculateTWR, calculateVolatility, calculateSharpeRatio,
  calculateBeta, calculateAlpha, computeAssetAllocation, calculatePortfolioDrift,
  annualizeReturn, TARGET_ALLOCATIONS, PeriodReturn,
} from '../calculations/engine';
import { generateRecommendations } from '../calculations/recommendations';
import { GoalCategory } from '../types';
import { ragEngine, ClientFinancialContext } from './rag/engine';
import { aiPipeline } from './rag/pipeline';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo';

// ─── Auth Service ─────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const user = await repo.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return null;
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    onboarding_complete: user.onboarding_complete,
    segment: user.segment,
    token,
  };
}

export async function registerUser(email: string, password: string, name: string) {
  const existing = await repo.findUserByEmail(email);
  if (existing) throw new Error('User already exists');

  const password_hash = bcrypt.hashSync(password, 10);
  const user = await repo.createUser({
    email,
    password_hash,
    name,
    role: 'client',
    onboarding_complete: false,
    segment: 'Mass Affluent',
  });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    onboarding_complete: user.onboarding_complete,
    segment: user.segment,
    token,
  };
}

export async function updateUserPreferences(userId: string, preferences: { display_currency?: string }) {
  const profile = await repo.upsertClientProfile(userId, preferences);
  return {
    display_currency: profile.display_currency,
  };
}

// ─── Risk Questions ───────────────────────────────────────────────────────────
export function getRiskQuestions() {
  return RISK_QUESTIONS;
}

// ─── Wealth Discovery ─────────────────────────────────────────────────────────
export interface WealthDiscoveryPayload {
  // Step 1: Basic Info & Family
  dob: string;
  occupation: string;
  marital_status: string;
  dependents: Array<{ name: string; relationship: string; dob: string }>;

  // Step 2: Income
  income: { salary: number; business: number; rental: number; other: number };

  // Step 3: Assets (institution -> account -> holdings)
  accounts: Array<{
    institution_name: string;
    institution_type: string;
    account_name: string;
    account_type: string;
    holdings: Array<{
      name: string;
      category: string;
      current_value: number;
      is_liquid: boolean;
    }>;
  }>;

  // Step 4: Liabilities
  liabilities: Array<{
    name: string;
    category: string;
    outstanding_balance: number;
    interest_rate: number;
    monthly_payment: number;
  }>;

  // Step 5: Goals
  goals: Array<{
    name: string;
    category: string;
    priority: string;
    target_amount: number;
    target_year: number;
    already_saved: number;
    monthly_contribution: number;
  }>;

  // Step 6: Risk Assessment (question_id -> score)
  risk_answers: Record<string, number>;

  // Step 7: Insurance
  insurance: {
    life_coverage: number;
    health_coverage: number;
    disability_coverage_monthly: number;
    has_long_term_care: boolean;
  };

  // Step 8: Consent
  has_will: boolean;
  has_poa: boolean;
  has_hc_proxy: boolean;
  consent_advisory_disclaimer: boolean;
}

export async function submitWealthDiscovery(userId: string, payload: WealthDiscoveryPayload) {
  // ── Step 1: Save household profile ─────────────────────────────────────────
  const dob = new Date(payload.dob);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  await repo.upsertHouseholdProfile(userId, {
    marital_status: payload.marital_status,
    occupation: payload.occupation,
  });

  for (const d of payload.dependents) {
    await repo.addHouseholdMember(userId, {
      relationship: d.relationship as any,
      name: d.name,
      dob: d.dob,
    });
  }

  // ── Step 2: Save income profile ────────────────────────────────────────────
  const incomeProfile = await repo.upsertIncomeProfile(userId, payload.income);
  const annualIncome = (incomeProfile.salary + incomeProfile.business + incomeProfile.rental + incomeProfile.other);
  const monthlyNetIncome = annualIncome / 12;
  const hasDependents = payload.dependents.length > 0;

  // ── Step 3: Save accounts & holdings ──────────────────────────────────────
  let totalInvestableAssets = 0;
  let liquidCash = 0;

  for (const acct of payload.accounts) {
    const institution = await repo.createInstitution(userId, {
      name: acct.institution_name,
      type: acct.institution_type,
    });

    const account = await repo.createAccount(userId, {
      institution_id: institution.id,
      name: acct.account_name,
      type: acct.account_type as any,
    });

    for (const h of acct.holdings) {
      await repo.createHolding(userId, {
        account_id: account.id,
        name: h.name,
        category: h.category as any,
        current_value: h.current_value,
        is_liquid: h.is_liquid,
      });
      totalInvestableAssets += h.current_value;
      if (h.is_liquid) liquidCash += h.current_value;
    }
  }

  // ── Step 4: Save liabilities ────────────────────────────────────────────────
  let totalDebt = 0;
  let highInterestDebt = 0;
  let highInterestDebtRate = 0;
  let monthlyDebtPayments = 0;

  for (const l of payload.liabilities) {
    await repo.createLiability(userId, {
      name: l.name,
      category: l.category as any,
      outstanding_balance: l.outstanding_balance,
      interest_rate: l.interest_rate,
      monthly_payment: l.monthly_payment,
    });
    totalDebt += l.outstanding_balance;
    monthlyDebtPayments += l.monthly_payment;
    if (l.interest_rate > 0.08) {
      highInterestDebt += l.outstanding_balance;
      highInterestDebtRate = Math.max(highInterestDebtRate, l.interest_rate);
    }
  }

  // ── Step 5: Save goals (with shortfall calculation) ─────────────────────────
  const assumptions = await repo.getAssumptions(userId);
  let goalsFunded = 0;
  let totalGoals = payload.goals.length;

  for (const g of payload.goals) {
    const years = yearsUntilYear(g.target_year);
    const inflationRate = g.category === 'Education' ? assumptions.education_inflation
      : g.category === 'Retirement' ? assumptions.retirement_inflation
      : assumptions.inflation_rate;
    const returnRate = assumptions.expected_return;

    const futureCost = calculateInflationAdjustedCost(g.target_amount, inflationRate, years);
    const fvAssets = calculateFutureValue(g.already_saved, returnRate, years);
    const fvSavings = calculateFutureValueOfSavings(g.monthly_contribution, returnRate, years);
    const shortfall = calculateGoalShortfall(futureCost, fvAssets, fvSavings, 0);

    if (shortfall <= 0) goalsFunded++;

    await repo.createGoal(userId, {
      name: g.name,
      category: g.category as GoalCategory,
      priority: g.priority as 'High' | 'Medium' | 'Low',
      target_amount: g.target_amount,
      target_year: g.target_year,
      already_saved: g.already_saved,
      monthly_contribution: g.monthly_contribution,
      shortfall: Math.round(shortfall),
    });
  }

  const goalFundingRatio = totalGoals > 0 ? goalsFunded / totalGoals : 1;

  // ── Step 6: Risk score → risk profile ───────────────────────────────────────
  const riskScore = Object.values(payload.risk_answers).reduce((s, v) => s + v, 0);
  const riskProfile = scoreToRiskProfile(riskScore);

  // ── Step 7: Insurance ─────────────────────────────────────────────────────
  const insurance = await repo.upsertInsuranceProfile(userId, payload.insurance);
  const disabilityTarget = monthlyNetIncome * 0.60;
  const lifeTarget = (annualIncome * 10) + totalDebt;
  const disabilityCoverageRatio = insurance.disability_coverage_monthly / Math.max(1, disabilityTarget);
  const lifeCoverageRatio = insurance.life_coverage / Math.max(1, lifeTarget);

  // ── Step 8: Derive segment & update user ──────────────────────────────────
  const segment = deriveWealthSegment(totalInvestableAssets, annualIncome);
  await repo.updateUser(userId, {
    onboarding_complete: true,
    segment,
  });

  // ── Save client profile ────────────────────────────────────────────────────
  const monthlyExpenses = monthlyNetIncome * 0.70; // estimated
  const monthlySavings = monthlyNetIncome - monthlyExpenses - monthlyDebtPayments;
  const savingsRate = monthlyNetIncome > 0 ? Math.max(0, monthlySavings / monthlyNetIncome) : 0;
  const jobVolatility = savingsRate > 0.20 ? 'low' : savingsRate > 0.10 ? 'medium' : 'high';

  await repo.upsertClientProfile(userId, {
    age,
    risk_profile: riskProfile,
    display_currency: 'INR',
    has_will: payload.has_will,
    has_poa: payload.has_poa,
    has_hc_proxy: payload.has_hc_proxy,
  });

  // ── Calculate WHS ──────────────────────────────────────────────────────────
  const emergencyFundTarget = calculateEmergencyFundTarget(monthlyExpenses, jobVolatility, hasDependents);
  const retirementGoal = payload.goals.find(g => g.category === 'Retirement');
  let retirementReadinessRatio = 0.5; // default if no retirement goal
  if (retirementGoal) {
    const retYears = yearsUntilYear(retirementGoal.target_year);
    const fvRet = calculateFutureValue(retirementGoal.already_saved, assumptions.expected_return, retYears)
      + calculateFutureValueOfSavings(retirementGoal.monthly_contribution, assumptions.expected_return, retYears);
    const futureCostRet = calculateInflationAdjustedCost(retirementGoal.target_amount, assumptions.retirement_inflation, retYears);
    retirementReadinessRatio = Math.min(1, fvRet / Math.max(1, futureCostRet));
  }

  const whsResult = calculateWHS({
    liquidCashBalance: liquidCash,
    emergencyFundTarget,
    highInterestDebt,
    totalDebt,
    totalAssets: totalInvestableAssets,
    monthlyNetIncome,
    monthlySavings: Math.max(0, monthlySavings),
    savingsRate,
    targetSavingsRate: 0.15,
    portfolioDrift: 0.05,
    retirementReadinessRatio,
    goalFundingRatio,
    disabilityCoverageRatio,
    lifeCoverageRatio,
    hasLTC: insurance.has_long_term_care,
    age,
    hasWill: payload.has_will,
    hasPOA: payload.has_poa,
    hasHCProxy: payload.has_hc_proxy,
  });

  const whsCategory = getWHSCategory(whsResult.score);
  await repo.appendWhsHistory(userId, whsResult.score, whsCategory);

  // ── Generate Recommendations ───────────────────────────────────────────────
  const generatedRecs = generateRecommendations({
    userId,
    liquidCash,
    emergencyFundTarget,
    monthlyExpenses,
    monthlyNetIncome,
    monthlySavings: Math.max(0, monthlySavings),
    totalDebt,
    highInterestDebt,
    highInterestDebtRate,
    savingsRate,
    retirementReadinessRatio,
    goalFundingRatio,
    disabilityCoverageRatio,
    lifeCoverageRatio,
    hasWill: payload.has_will,
    hasPOA: payload.has_poa,
    hasHCProxy: payload.has_hc_proxy,
    hasEmergencyFundGoal: payload.goals.some(g => g.category === 'Emergency Fund'),
  });
  await repo.replaceRecommendations(userId, generatedRecs);

  // ── Return Financial Snapshot ─────────────────────────────────────────────
  return {
    segment,
    risk_profile: riskProfile,
    whs: {
      score: whsResult.score,
      category: whsCategory,
      pillars: whsResult.pillars,
      ...whsResult.metrics,
    },
    top_risks: generatedRecs
      .filter(r => r.priority === 'Critical' || r.priority === 'High')
      .slice(0, 3)
      .map(r => ({ priority: r.priority, category: r.category, message: r.alert_message })),
    assumptions,
    disclaimer: 'Advisory simulation only. Recommendations are not trading orders and do not constitute financial advice.',
  };
}

// ─── WHS Service ──────────────────────────────────────────────────────────────
export async function getWHSSnapshot(userId: string) {
  const [
    profile,
    userHoldings,
    userLiabilities,
    incomeProfile,
    insurance,
    assumptions,
    userGoals,
    recommendations
  ] = await Promise.all([
    repo.getClientProfile(userId),
    repo.getHoldings(userId),
    repo.getLiabilities(userId),
    repo.getIncomeProfile(userId),
    repo.getInsuranceProfile(userId),
    repo.getAssumptions(userId),
    repo.getGoals(userId),
    repo.getRecommendations(userId)
  ]);


  if (!profile) return null;

  const annualIncome = incomeProfile
    ? (incomeProfile.salary + incomeProfile.business + incomeProfile.rental + incomeProfile.other)
    : 0;
  const monthlyNetIncome = annualIncome / 12;
  const totalAssets = userHoldings.reduce((s, h) => s + h.current_value, 0);
  const liquidCash = userHoldings.filter(h => h.is_liquid).reduce((s, h) => s + h.current_value, 0);
  const totalDebt = userLiabilities.reduce((s, l) => s + l.outstanding_balance, 0);
  const highInterestDebt = userLiabilities.filter(l => l.interest_rate > 0.08).reduce((s, l) => s + l.outstanding_balance, 0);
  const monthlyDebtPayments = userLiabilities.reduce((s, l) => s + l.monthly_payment, 0);
  const monthlyExpenses = monthlyNetIncome * 0.70;
  const monthlySavings = Math.max(0, monthlyNetIncome - monthlyExpenses - monthlyDebtPayments);
  const savingsRate = monthlyNetIncome > 0 ? monthlySavings / monthlyNetIncome : 0;
  const members = await repo.getHouseholdMembers(userId);
  const hasDependents = members.length > 0;
  const jobVolatility = savingsRate > 0.20 ? 'low' : savingsRate > 0.10 ? 'medium' : 'high';
  const emergencyFundTarget = calculateEmergencyFundTarget(monthlyExpenses, jobVolatility, hasDependents);

  const disabilityTarget = monthlyNetIncome * 0.60;
  const lifeCoverageTarget = (annualIncome * 10) + totalDebt;
  const disabilityCoverageRatio = insurance
    ? insurance.disability_coverage_monthly / Math.max(1, disabilityTarget) : 0;
  const lifeCoverageRatio = insurance
    ? insurance.life_coverage / Math.max(1, lifeCoverageTarget) : 0;

  // Retirement readiness
  const retirementGoal = userGoals.find(g => g.category === 'Retirement');
  let retirementReadinessRatio = 0.5;
  if (retirementGoal) {
    const retYears = yearsUntilYear(retirementGoal.target_year);
    const fvRet = calculateFutureValue(retirementGoal.already_saved, assumptions.expected_return, retYears)
      + calculateFutureValueOfSavings(retirementGoal.monthly_contribution, assumptions.expected_return, retYears);
    retirementReadinessRatio = Math.min(1, fvRet / Math.max(1, retirementGoal.target_amount));
  }

  // Goal funding ratio
  const goalsOnTrack = userGoals.filter(g => g.shortfall <= 0).length;
  const goalFundingRatio = userGoals.length > 0 ? goalsOnTrack / userGoals.length : 1;

  // Portfolio Drift
  const portfolioDrift = inferPortfolioDrift(
    userHoldings.map(h => ({ category: h.category, currentValue: Number(h.current_value) })),
    profile.risk_profile || 'Balanced'
  );

  // Dynamic Estate Planning (via Recommendations)
  const estateRecs = recommendations.filter(r => r.category === 'Estate Planning');
  const hasResolvedEstate = estateRecs.some(r => r.status === 'Addressed' || r.status === 'Dismissed');
  
  const result = calculateWHS({
    liquidCashBalance: liquidCash,
    emergencyFundTarget,
    highInterestDebt,
    totalDebt,
    totalAssets,
    monthlyNetIncome,
    monthlySavings,
    savingsRate,
    targetSavingsRate: 0.15,
    portfolioDrift,
    retirementReadinessRatio,
    goalFundingRatio,
    disabilityCoverageRatio,
    lifeCoverageRatio,
    hasLTC: insurance?.has_long_term_care ?? false,
    age: profile.age,
    hasWill: profile.has_will || hasResolvedEstate,
    hasPOA: profile.has_poa || hasResolvedEstate,
    hasHCProxy: profile.has_hc_proxy || hasResolvedEstate,
  });

  return {
    user_id: userId,
    score: result.score,
    category: getWHSCategory(result.score),
    score_emergency_fund: result.pillars.emergency_fund,
    score_debt_mgmt: result.pillars.debt_mgmt,
    score_savings_rate: result.pillars.savings_rate,
    score_portfolio_drift: result.pillars.portfolio_drift,
    score_retirement_readiness: result.pillars.retirement_readiness,
    score_insurance_protection: result.pillars.insurance_protection,
    score_estate_planning: result.pillars.estate_planning,
    ...result.metrics,
    updated_at: new Date().toISOString(),
    disclaimer: 'Advisory simulation only. Recommendations are not trading orders and do not constitute financial advice.',
  };
}

// ─── Net Worth Service ────────────────────────────────────────────────────────
export async function getNetWorth(userId: string) {
  return repo.getNetWorthHistory(userId);
}

// ─── Goal Service ─────────────────────────────────────────────────────────────
export async function getGoals(userId: string) {
  return repo.getGoals(userId);
}

export async function createGoal(userId: string, body: {
  name: string; category: GoalCategory; priority: 'High' | 'Medium' | 'Low';
  target_amount: number; target_year: number; already_saved: number; monthly_contribution: number;
}) {
  const assumptions = await repo.getAssumptions(userId);
  const years = yearsUntilYear(body.target_year);
  const inflationRate = body.category === 'Education' ? assumptions.education_inflation
    : body.category === 'Retirement' ? assumptions.retirement_inflation
    : assumptions.inflation_rate;
  const returnRate = assumptions.expected_return;

  const futureCost = calculateInflationAdjustedCost(body.target_amount, inflationRate, years);
  const fvAssets = calculateFutureValue(body.already_saved, returnRate, years);
  const fvSavings = calculateFutureValueOfSavings(body.monthly_contribution, returnRate, years);
  const shortfall = calculateGoalShortfall(futureCost, fvAssets, fvSavings, 0);

  return repo.createGoal(userId, { ...body, shortfall: Math.round(shortfall) });
}

export async function updateGoal(userId: string, goalId: string, body: Partial<{
  name: string; category: GoalCategory; priority: 'High' | 'Medium' | 'Low';
  target_amount: number; target_year: number; already_saved: number; monthly_contribution: number;
}>) {
  const existingGoal = await repo.getGoalById(userId, goalId);
  if (!existingGoal) return null;

  const merged = {
    name: body.name ?? existingGoal.name,
    category: (body.category ?? existingGoal.category) as GoalCategory,
    priority: (body.priority ?? existingGoal.priority) as 'High' | 'Medium' | 'Low',
    target_amount: body.target_amount ?? existingGoal.target_amount,
    target_year: body.target_year ?? existingGoal.target_year,
    already_saved: body.already_saved ?? existingGoal.already_saved,
    monthly_contribution: body.monthly_contribution ?? existingGoal.monthly_contribution,
  };

  const assumptions = await repo.getAssumptions(userId);
  const years = yearsUntilYear(merged.target_year);
  const inflationRate = merged.category === 'Education' ? assumptions.education_inflation
    : merged.category === 'Retirement' ? assumptions.retirement_inflation
    : assumptions.inflation_rate;
  const returnRate = assumptions.expected_return;

  const futureCost = calculateInflationAdjustedCost(merged.target_amount, inflationRate, years);
  const fvAssets = calculateFutureValue(merged.already_saved, returnRate, years);
  const fvSavings = calculateFutureValueOfSavings(merged.monthly_contribution, returnRate, years);
  const shortfall = calculateGoalShortfall(futureCost, fvAssets, fvSavings, 0);

  return repo.updateGoal(userId, goalId, {
    ...merged,
    shortfall: Math.round(shortfall),
  });
}

export async function getGoalOptions(userId: string, goalId: string) {
  const goal = await repo.getGoalById(userId, goalId);
  if (!goal || goal.shortfall <= 0) return null;
  const assumptions = await repo.getAssumptions(userId);
  const years = yearsUntilYear(goal.target_year);
  const r = assumptions.expected_return;
  const inflationRate = goal.category === 'Education' ? assumptions.education_inflation
    : goal.category === 'Retirement' ? assumptions.retirement_inflation
    : assumptions.inflation_rate;

  return {
    goal_id: goalId,
    shortfall: goal.shortfall,
    option_a_required_monthly_savings: Math.round(
      calculateRequiredSavings(goal.shortfall, r, years) + goal.monthly_contribution
    ),
    option_b_supported_present_cost: Math.round(
      calculateSupportableCost(
        calculateFutureValue(goal.already_saved, r, years),
        calculateFutureValueOfSavings(goal.monthly_contribution, r, years),
        0, inflationRate, years
      )
    ),
    option_c_delay_months: calculateDelayMonths(goal.shortfall, goal.monthly_contribution, r),
  };
}

export async function deleteGoal(userId: string, goalId: string) {
  return repo.deleteGoal(userId, goalId);
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export async function getRecommendations(userId: string) {
  return repo.getRecommendations(userId);
}

export async function updateRecommendation(userId: string, recId: string, status: 'Active' | 'Dismissed' | 'Snoozed' | 'Addressed') {
  return repo.updateRecommendationStatus(userId, recId, status);
}

// ─── Assumptions ─────────────────────────────────────────────────────────────
export async function getAssumptions(userId: string) {
  return repo.getAssumptions(userId);
}

// ─── Advisor ──────────────────────────────────────────────────────────────────
export async function getAdvisorClients(advisorId: string) {
  const clients = await repo.getAdvisorClients(advisorId);
  return Promise.all(clients.map(async (u) => {
    const profile = await repo.getClientProfile(u.id);
    const whs = await getWHSSnapshot(u.id);
    return {
      id: u.id, name: u.name, email: u.email,
      whs_score: whs?.score ?? 0,
      whs_category: whs?.category ?? 'VULNERABLE',
      segment: u.segment,
      age: profile?.age,
    };
  }));
}

// ─── Investment Management Module (Phase 1) ───────────────────────────────────

function getMockMonthlyReturns(seed: number): number[] {
  const returns: number[] = [];
  let prng = seed;
  for (let i = 0; i < 12; i++) {
    prng = (prng * 1664525 + 1013904223) & 0xffffffff;
    returns.push(((prng >>> 0) / 0xffffffff - 0.48) * 0.06); // ±3% monthly
  }
  return returns;
}

const BENCHMARK_MONTHLY_RETURNS = [
  0.015, -0.008, 0.022, 0.011, -0.012, 0.019,
  0.008, -0.005, 0.017, 0.021, -0.003, 0.014,
];

const RISK_FREE_RATE_ANNUAL = 0.065;

export async function getPortfolioSummary(userId: string) {
  const holdings = await repo.getHoldings(userId);
  const liabilities = await repo.getLiabilities(userId);
  const incomeProfile = await repo.getIncomeProfile(userId);
  const clientProfile = await repo.getClientProfile(userId);
  const accounts = await repo.getAccounts(userId);
  const institutions = await repo.getInstitutions(userId);

  const totalValue = holdings.reduce((s, h) => s + h.current_value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.outstanding_balance, 0);
  const netWorth = totalValue - totalLiabilities;

  const byAssetClass: Record<string, { value: number; count: number }> = {};
  for (const h of holdings) {
    if (!byAssetClass[h.category]) byAssetClass[h.category] = { value: 0, count: 0 };
    byAssetClass[h.category].value += h.current_value;
    byAssetClass[h.category].count += 1;
  }

  const byInstitution = institutions.map(inst => {
    const instAccounts = accounts.filter(a => a.institution_id === inst.id);
    const instHoldings = holdings.filter(h => instAccounts.some(a => a.id === h.account_id));
    return {
      institution_id: inst.id,
      institution_name: inst.name,
      institution_type: inst.type,
      total_value: instHoldings.reduce((s, h) => s + h.current_value, 0),
      account_count: instAccounts.length,
    };
  });

  const allocationPercent: Record<string, number> = {};
  for (const [cat, data] of Object.entries(byAssetClass)) {
    allocationPercent[cat] = totalValue > 0 ? data.value / totalValue : 0;
  }

  return {
    user_id: userId,
    total_portfolio_value: Math.round(totalValue),
    total_liabilities: Math.round(totalLiabilities),
    net_worth: Math.round(netWorth),
    holdings_count: holdings.length,
    account_count: accounts.length,
    institution_count: institutions.length,
    risk_profile: clientProfile?.risk_profile ?? 'Balanced',
    by_asset_class: Object.entries(byAssetClass).map(([category, data]) => ({
      category,
      value: Math.round(data.value),
      percentage: Math.round(allocationPercent[category] * 10000) / 100,
      count: data.count,
    })).sort((a, b) => b.value - a.value),
    by_institution: byInstitution,
    disclaimer: 'Advisory simulation only. Not a live custodian feed.',
  };
}

export async function getPortfolioPerformance(userId: string) {
  const holdings = await repo.getHoldings(userId);
  const clientProfile = await repo.getClientProfile(userId);
  const totalValue = holdings.reduce((s, h) => s + h.current_value, 0);

  const seed = Math.abs(Math.round(totalValue)) || 12345;
  const monthlyReturns = getMockMonthlyReturns(seed);

  let runningValue = totalValue * 0.88;
  const periods: PeriodReturn[] = monthlyReturns.map(r => {
    const startValue = runningValue;
    const endValue = startValue * (1 + r);
    runningValue = endValue;
    return { startValue, endValue };
  });

  const twr = calculateTWR(periods);
  const annualizedTWR = annualizeReturn(twr, 1);
  const volatility = calculateVolatility(monthlyReturns, 12);
  const sharpe = calculateSharpeRatio(annualizedTWR, RISK_FREE_RATE_ANNUAL, volatility);
  const beta = calculateBeta(monthlyReturns, BENCHMARK_MONTHLY_RETURNS);
  const benchmarkTWR = calculateTWR(
    BENCHMARK_MONTHLY_RETURNS.map((r, i) => ({
      startValue: 100000 * Math.pow(1.001, i),
      endValue: 100000 * Math.pow(1.001, i) * (1 + r),
    }))
  );
  const alpha = calculateAlpha(annualizedTWR, annualizeReturn(benchmarkTWR, 1), RISK_FREE_RATE_ANNUAL, beta);

  let chartValue = totalValue * 0.88;
  let benchValue = totalValue * 0.88;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const chartData = monthlyReturns.map((r, i) => {
    const monthIdx = (currentMonth - 11 + i + 12) % 12;
    chartValue *= (1 + r);
    benchValue *= (1 + BENCHMARK_MONTHLY_RETURNS[i]);
    return {
      month: monthNames[monthIdx],
      portfolio_value: Math.round(chartValue),
      benchmark_value: Math.round(benchValue),
      portfolio_return_pct: Math.round(r * 10000) / 100,
    };
  });

  return {
    user_id: userId,
    risk_profile: clientProfile?.risk_profile ?? 'Balanced',
    period: 'YTD (12 months)',
    twr_pct: Math.round(twr * 10000) / 100,
    annualized_return_pct: Math.round(annualizedTWR * 10000) / 100,
    benchmark_return_pct: Math.round(benchmarkTWR * 10000) / 100,
    outperformance_pct: Math.round((twr - benchmarkTWR) * 10000) / 100,
    volatility_pct: Math.round(volatility * 10000) / 100,
    sharpe_ratio: Math.round(sharpe * 100) / 100,
    beta: Math.round(beta * 100) / 100,
    alpha_pct: Math.round(alpha * 10000) / 100,
    risk_free_rate_pct: Math.round(RISK_FREE_RATE_ANNUAL * 10000) / 100,
    monthly_chart: chartData,
    disclaimer: 'Performance is simulated for advisory illustration. Based on current holdings snapshot, not live price feeds.',
  };
}

export async function getAssetAllocation(userId: string) {
  const holdings = await repo.getHoldings(userId);
  const clientProfile = await repo.getClientProfile(userId);
  const riskProfile = clientProfile?.risk_profile ?? 'Balanced';

  const currentAllocation = computeAssetAllocation(holdings);
  const targetAllocation = TARGET_ALLOCATIONS[riskProfile] ?? TARGET_ALLOCATIONS['Balanced'];
  const { totalDrift, driftByAsset } = calculatePortfolioDrift(currentAllocation, targetAllocation);

  const totalValue = holdings.reduce((s, h) => s + h.current_value, 0);

  const allAssets = new Set([...Object.keys(currentAllocation), ...Object.keys(targetAllocation)]);
  const breakdown = Array.from(allAssets).map(cat => ({
    category: cat,
    current_pct: Math.round((currentAllocation[cat] ?? 0) * 10000) / 100,
    target_pct: Math.round((targetAllocation[cat] ?? 0) * 10000) / 100,
    drift_pct: Math.round((driftByAsset[cat] ?? 0) * 10000) / 100,
    current_value: Math.round((currentAllocation[cat] ?? 0) * totalValue),
    needs_rebalance: (driftByAsset[cat] ?? 0) > 0.05,
  })).sort((a, b) => b.current_pct - a.current_pct);

  return {
    user_id: userId,
    risk_profile: riskProfile,
    total_portfolio_value: Math.round(totalValue),
    total_drift_pct: Math.round(totalDrift * 10000) / 100,
    needs_rebalance: totalDrift > 0.10,
    breakdown,
    disclaimer: 'Target allocations are derived from Ric Edelman\'s portfolio methodology for your risk profile.',
  };
}

export async function getRebalancingAlerts(userId: string) {
  const allocation = await getAssetAllocation(userId);
  const alerts = allocation.breakdown
    .filter(b => b.needs_rebalance)
    .map(b => ({
      category: b.category,
      action: b.current_pct > b.target_pct ? 'REDUCE' : 'INCREASE',
      current_pct: b.current_pct,
      target_pct: b.target_pct,
      drift_pct: b.drift_pct,
      amount_to_move: Math.round(Math.abs(b.current_pct - b.target_pct) / 100 * allocation.total_portfolio_value),
      message: b.current_pct > b.target_pct
        ? `Your ${b.category} allocation is ${b.drift_pct}% above target. Consider reducing exposure.`
        : `Your ${b.category} allocation is ${b.drift_pct}% below target. Consider increasing exposure.`,
    }));

  return {
    user_id: userId,
    risk_profile: allocation.risk_profile,
    needs_rebalance: allocation.needs_rebalance,
    total_drift_pct: allocation.total_drift_pct,
    alert_count: alerts.length,
    alerts,
    disclaimer: 'These are advisory suggestions only. Execute any trades through your external custodian broker.',
  };
}

// ─── AI Coach Services (RAG Engine Integrated) ───────────────────────────────

async function fetchClientFinancialContext(userId: string): Promise<ClientFinancialContext> {
  try {
    const [profile, whs, goals, liabilities, holdings, insurance, income] = await Promise.all([
      repo.getClientProfile(userId),
      getWHSSnapshot(userId),
      repo.getGoals(userId),
      repo.getLiabilities(userId),
      repo.getHoldings(userId),
      repo.getInsuranceProfile(userId),
      repo.getIncomeProfile(userId)
    ]);

    const totalValue = holdings.reduce((s, h) => s + h.current_value, 0);
    const byAssetClass: Record<string, number> = {};
    for (const h of holdings) {
      if (!byAssetClass[h.category]) byAssetClass[h.category] = 0;
      byAssetClass[h.category] += h.current_value;
    }
    const portfolio = Object.entries(byAssetClass).map(([cat, val]) => ({
      category: cat,
      percentage: totalValue > 0 ? Math.round((val / totalValue) * 100) : 0
    }));

    const annualIncome = income ? (income.salary + income.business + income.rental + income.other) : 0;
    const monthlyNetIncome = annualIncome / 12;
    const monthlyExpenses = monthlyNetIncome * 0.70;
    const monthlyDebtPayments = liabilities.reduce((s, l) => s + l.monthly_payment, 0);
    const cashFlow = monthlyNetIncome - monthlyExpenses - monthlyDebtPayments;

    return {
      age: profile?.age ?? 35,
      netWorth: whs?.net_worth ?? 0,
      savingsRate: whs?.savings_rate ?? 0,
      emergencyFundMonths: whs?.emergency_fund_coverage ?? 0,
      riskProfile: profile?.risk_profile ?? 'Balanced',
      debts: liabilities.map(l => ({
        title: l.name,
        amount: l.outstanding_balance,
        apr: l.interest_rate
      })),
      goals: goals.map(g => ({
        name: g.name,
        targetAmount: g.target_amount,
        targetYear: g.target_year,
        isFunded: g.already_saved >= g.target_amount
      })),
      cashFlow: Math.round(cashFlow),
      assets: Math.round(totalValue),
      portfolio,
      insurance: insurance ? {
        lifeCoverage: insurance.life_coverage,
        disabilityCoverage: insurance.disability_coverage_monthly,
        hasLTC: insurance.has_long_term_care
      } : undefined,
      retirementReadiness: whs?.score_retirement_readiness ?? 0,
      whsScore: whs?.score ?? 57,
      whsCategory: whs?.category ?? 'Caution',
      userId,
    };
  } catch (err) {
    console.warn('[SERVICES] Warning fetching client context for RAG:', err);
    return {};
  }
}

export async function getAIGoalCoachMessage(userId: string, goalId: string) {
  const goal = await repo.getGoalById(userId, goalId);
  const options = await getGoalOptions(userId, goalId);
  if (!goal || !options) return null;

  const clientContext = await fetchClientFinancialContext(userId);

  const pipelineRes = await aiPipeline.execute({
    purpose: 'goal-analysis',
    userId,
    goalId,
    goalData: goal,
    goalOptions: options,
    clientContext
  });

  return pipelineRes.formattedOutput;
}

export async function getAIRetirementCoachMessage(userId: string) {
  const clientContext = await fetchClientFinancialContext(userId);

  const pipelineRes = await aiPipeline.execute({
    purpose: 'retirement-analysis',
    userId,
    clientContext
  });

  return pipelineRes.formattedOutput;
}

export async function getAIRecommendationExplanation(userId: string, recId: string) {
  const recs = await repo.getRecommendations(userId);
  const rec = recs.find(r => r.id === recId);
  if (!rec) return null;

  const clientContext = await fetchClientFinancialContext(userId);

  const pipelineRes = await aiPipeline.execute({
    purpose: 'priority-analysis',
    userId,
    recommendationId: recId,
    recommendationData: rec,
    clientContext
  });

  return pipelineRes.formattedOutput;
}

export async function chatWithAdvisor(userId: string, message: string, chatHistory: any[] = []) {
  const clientContext = await fetchClientFinancialContext(userId);
  const trimmed = message.trim().toLowerCase();

  // Small-talk / Greeting Intent Detection (word boundary match for short messages <= 20 chars)
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'hola', 'namaste'];
  const farewells = ['bye', 'by', 'goodbye', 'see you', 'talk to you later', 'take care'];
  const grateful = ['thanks', 'thank you', 'thx', 'appreciate it'];

  const isGreetingMatch = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'hola', 'namaste'].includes(trimmed.replace(/[^\w\s]/g, '').trim());
  const isFarewellMatch = ['bye', 'by', 'goodbye', 'see you', 'talk to you later', 'take care'].includes(trimmed.replace(/[^\w\s]/g, '').trim());
  const isGratefulMatch = ['thanks', 'thank you', 'thx', 'appreciate it'].includes(trimmed.replace(/[^\w\s]/g, '').trim());

  if (isGreetingMatch) {
    return {
      reply: `Hello! How can I assist you with your financial plan today?`,
      suggestedFollowUps: [
        'How can I grow my net worth?',
        'What is the Edelman 7-Pillar Methodology?',
        'How much emergency fund do I need?',
        'Should I pay debt or invest first?'
      ],
      disclaimer: 'Advisory simulation only. Not financial advice.'
    };
  }

  if (isFarewellMatch) {
    return {
      reply: `Goodbye! Stay disciplined with your savings rate and wealth goals. Feel free to reach out whenever you want to update your plan.`,
      suggestedFollowUps: [],
      disclaimer: 'Advisory simulation only. Not financial advice.'
    };
  }

  if (isGratefulMatch) {
    return {
      reply: `You're very welcome! Let me know if you have any other questions about your wealth health score or portfolio strategy.`,
      suggestedFollowUps: [
        'How is my Wealth Health Score calculated?',
        'How can I improve my lowest scoring pillar?',
        'What should I prioritize next?'
      ],
      disclaimer: 'Advisory simulation only. Not financial advice.'
    };
  }

  const pipelineRes = await aiPipeline.execute({
    purpose: 'chat',
    userId,
    query: message,
    chatHistory,
    clientContext
  });

  return pipelineRes.formattedOutput;
}
