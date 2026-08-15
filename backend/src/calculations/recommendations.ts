/**
 * Recommendation Engine
 * Generates prioritized, explainer-rich advisory alerts from financial data.
 * All advisory decisions live here — never in controllers or services.
 *
 * Scope: ADVISORY ONLY. Must NOT execute trades, buy/sell securities,
 * hold customer money, or place investment orders.
 */
import { RecommendationAlert, AlertPriority } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface FinancialSnapshot {
  userId: string;
  liquidCash: number;
  emergencyFundTarget: number;
  monthlyExpenses: number;
  monthlyNetIncome: number;
  monthlySavings: number;
  totalDebt: number;
  highInterestDebt: number;
  highInterestDebtRate: number;
  savingsRate: number;
  retirementReadinessRatio: number;
  goalFundingRatio: number;
  disabilityCoverageRatio: number;
  lifeCoverageRatio: number;
  hasWill: boolean;
  hasPOA: boolean;
  hasHCProxy: boolean;
  hasEmergencyFundGoal: boolean;
}

interface GeneratedRecommendation {
  category: string;
  priority: AlertPriority;
  alert_message: string;
  reason: string;
  expected_benefit: string;
  action: string;
}

export function generateRecommendations(snapshot: FinancialSnapshot): Omit<RecommendationAlert, 'id' | 'created_at' | 'status'>[] {
  const recs: GeneratedRecommendation[] = [];

  // ── Emergency Fund ─────────────────────────────────────────────────────────
  const efMonthsCovered = snapshot.emergencyFundTarget > 0
    ? (snapshot.liquidCash / (snapshot.emergencyFundTarget / 6))
    : 6;
  if (efMonthsCovered < 3) {
    const gap = Math.round(snapshot.emergencyFundTarget - snapshot.liquidCash);
    recs.push({
      category: 'Emergency Fund',
      priority: 'Critical',
      alert_message: `Your emergency fund covers only ${efMonthsCovered.toFixed(1)} months of expenses. Your target is 6 months (₹${Math.round(snapshot.emergencyFundTarget).toLocaleString()}). You need ₹${Math.round(gap).toLocaleString()} more.`,
      reason: 'The Edelman methodology requires a minimum 3–6 month emergency buffer before allocating to growth assets. Without it, you risk liquidating long-term investments at a loss during income disruptions.',
      expected_benefit: 'Eliminates forced selling of growth assets during financial emergencies.',
      action: 'Open a high-yield savings account and automate monthly transfers until the emergency fund target is reached.',
    });
  } else if (efMonthsCovered < 6) {
    recs.push({
      category: 'Emergency Fund',
      priority: 'High',
      alert_message: `Your emergency fund covers ${efMonthsCovered.toFixed(1)} months. Your target is 6 months given your profile.`,
      reason: 'Given income or dependent profile, a 6-month buffer is recommended.',
      expected_benefit: 'Provides complete income protection for a typical job search period.',
      action: 'Continue building your emergency fund before increasing goal contributions.',
    });
  }

  // ── High-Interest Debt ─────────────────────────────────────────────────────
  if (snapshot.highInterestDebt > 0) {
    recs.push({
      category: 'Debt Management',
      priority: 'Critical',
      alert_message: `You are carrying ₹${snapshot.highInterestDebt.toLocaleString()} in high-interest debt at ${(snapshot.highInterestDebtRate * 100).toFixed(1)}% APR. This exceeds the 8% advisory threshold.`,
      reason: `A ${(snapshot.highInterestDebtRate * 100).toFixed(1)}% guaranteed "return" by eliminating debt always beats most market returns on a risk-adjusted basis. Edelman consistently prioritizes high-cost debt elimination before growth investing.`,
      expected_benefit: `Eliminating this balance saves approximately ₹${Math.round(snapshot.highInterestDebt * snapshot.highInterestDebtRate).toLocaleString()} per year in interest charges.`,
      action: 'Apply the Debt Avalanche strategy: redirect all discretionary savings to the highest-rate balance first, then cascade to the next.',
    });
  }

  // ── Savings Rate ───────────────────────────────────────────────────────────
  if (snapshot.savingsRate < 0.10) {
    recs.push({
      category: 'Savings Rate',
      priority: 'High',
      alert_message: `Your current savings rate is ${Math.round(snapshot.savingsRate * 100)}%, below the Edelman-recommended minimum of 15% of net income.`,
      reason: 'Edelman advises that a consistent 15%+ savings rate is the single most important determinant of long-term financial health, outweighing investment returns for most households.',
      expected_benefit: `Increasing to 15% would add ₹${Math.round((0.15 - snapshot.savingsRate) * snapshot.monthlyNetIncome).toLocaleString()} per month to your wealth-building capacity.`,
      action: 'Automate a monthly transfer on payday to a dedicated investment or savings account to increase your savings rate incrementally.',
    });
  }

  // ── Retirement Readiness ───────────────────────────────────────────────────
  if (snapshot.retirementReadinessRatio < 0.70) {
    const pct = Math.round(snapshot.retirementReadinessRatio * 100);
    recs.push({
      category: 'Retirement Planning',
      priority: snapshot.retirementReadinessRatio < 0.40 ? 'Critical' : 'High',
      alert_message: `Retirement readiness is ${pct}%. At your current contribution rate, you may face a significant retirement income gap.`,
      reason: 'Compounding is most powerful in the early years. A delay of 5 years in retirement savings can reduce terminal wealth by more than 30%, per Edelman\'s compounding analysis.',
      expected_benefit: 'Each percentage point increase in savings rate today significantly reduces the retirement gap through compounding.',
      action: 'Maximize your EPF/VPF contributions for tax-advantaged retirement savings, then review NPS (National Pension System) or ELSS SIP options based on your tax bracket and liquidity needs. Review your retirement goal in the Goals section.',
    });
  }

  // ── Disability Insurance Gap ───────────────────────────────────────────────
  if (snapshot.disabilityCoverageRatio < 0.80) {
    recs.push({
      category: 'Insurance',
      priority: 'High',
      alert_message: `Your disability coverage is ${Math.round(snapshot.disabilityCoverageRatio * 60)}% of income. The Edelman recommendation is at least 60% of gross income protected.`,
      reason: 'A 30-year-old has a greater probability of suffering a disability before retirement than of dying. Your income is your greatest financial asset.',
      expected_benefit: 'Adequate disability coverage protects your entire financial plan from collapsing if you cannot work.',
      action: 'Review your employer group disability policy. If coverage is below 60% of income, request a supplemental individual disability policy quote.',
    });
  }

  // ── Life Insurance Gap ─────────────────────────────────────────────────────
  if (snapshot.lifeCoverageRatio < 0.70) {
    recs.push({
      category: 'Insurance',
      priority: 'Medium',
      alert_message: `Your life insurance coverage appears below the recommended 10–12× annual income level.`,
      reason: 'Edelman recommends sufficient life coverage to replace your income for 10+ years and pay off all debts, protecting your dependents.',
      expected_benefit: 'Adequate life coverage ensures dependents maintain their lifestyle and financial goals without interruption.',
      action: 'Obtain term life insurance quotes. For most households, a 20-year level term policy provides optimal coverage at the lowest cost.',
    });
  }

  // ── Estate Planning ────────────────────────────────────────────────────────
  const missingEstateDocs = [
    !snapshot.hasWill && 'Will',
    !snapshot.hasPOA && 'Durable Power of Attorney',
    !snapshot.hasHCProxy && 'Healthcare Proxy',
  ].filter(Boolean);

  if (missingEstateDocs.length > 0) {
    recs.push({
      category: 'Estate Planning',
      priority: missingEstateDocs.length === 3 ? 'Critical' : 'High',
      alert_message: `Your estate plan is missing: ${missingEstateDocs.join(', ')}.`,
      reason: 'Without these documents, your assets cannot be distributed per your wishes and your family may face costly probate. Edelman considers estate documents as foundational financial hygiene.',
      expected_benefit: 'Ensures your wishes are legally documented and avoids costly, time-consuming probate proceedings.',
      action: 'Consult an estate attorney or use a reputable online legal service to draft the missing documents.',
    });
  }

  // ── Goal Funding ───────────────────────────────────────────────────────────
  if (snapshot.goalFundingRatio < 0.60 && snapshot.goalFundingRatio > 0) {
    recs.push({
      category: 'Goal Planning',
      priority: 'Medium',
      alert_message: `${Math.round((1 - snapshot.goalFundingRatio) * 100)}% of your goals have projected funding shortfalls. Visit the Goals section to activate the Edelman Solver options.`,
      reason: 'Goal shortfalls compound over time. Early adjustments (savings rate, timeline, cost) require smaller sacrifices than late corrections.',
      expected_benefit: 'Resolving goal shortfalls now prevents larger sacrifices close to goal deadlines.',
      action: 'Open the Goals section and use the three Edelman Solver options (A: Save More, B: Reduce Cost, C: Delay Timeline) for each shortfall.',
    });
  }

  return recs.map(r => ({
    ...r,
    user_id: snapshot.userId,
  }));
}
