/**
 * Repository layer — all data access is here.
 * Now using Prisma Client mapped to the new Postgres schema.
 */
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

import {
  User, ClientProfile, Holding, Account, Institution, Liability, Goal,
  RecommendationAlert, AlertStatus, AlertPriority, HouseholdProfile, HouseholdMember,
  IncomeProfile, InsuranceProfile, Assumptions,
} from '../types';

// Helper to convert Prisma Decimal back to plain JS number for the calculators
function toNumber(d: Prisma.Decimal | null | undefined): number {
  if (!d) return 0;
  return d.toNumber();
}

function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    password_hash: u.passwordHash,
    name: u.name,
    role: u.role,
    onboarding_complete: u.onboardingComplete,
    segment: u.segment,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return undefined;
  return mapUser(u);
}

export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const u = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.password_hash || '',
      role: data.role,
      onboardingComplete: data.onboarding_complete || false,
      segment: data.segment || 'Mass Market',
    }
  });
  return mapUser(u);
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return undefined;
  return mapUser(u);
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const data: any = {};
  if (updates.email !== undefined) data.email = updates.email;
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.password_hash !== undefined) data.passwordHash = updates.password_hash;
  if (updates.role !== undefined) data.role = updates.role;
  if (updates.onboarding_complete !== undefined) data.onboardingComplete = updates.onboarding_complete;
  if (updates.segment !== undefined) data.segment = updates.segment;

  const u = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return mapUser(u);
}

// ─── Client Profiles ─────────────────────────────────────────────────────────
export async function getClientProfile(userId: string): Promise<ClientProfile | undefined> {
  const p = await prisma.clientProfile.findUnique({ where: { userId } });
  if (!p) return undefined;
  return {
    user_id: p.userId,
    age: p.age,
    risk_profile: p.riskProfile as any,
    display_currency: p.displayCurrency,
    has_will: p.hasWill,
    has_poa: p.hasPoa,
    has_hc_proxy: p.hasHcProxy,
  };
}

export async function upsertClientProfile(userId: string, data: Partial<ClientProfile>): Promise<ClientProfile> {
  const p = await prisma.clientProfile.upsert({
    where: { userId },
    create: {
      userId,
      age: data.age ?? 30,
      riskProfile: data.risk_profile ?? 'Balanced',
      displayCurrency: data.display_currency ?? 'INR',
      hasWill: data.has_will ?? false,
      hasPoa: data.has_poa ?? false,
      hasHcProxy: data.has_hc_proxy ?? false,
    },
    update: {
      age: data.age,
      riskProfile: data.risk_profile,
      displayCurrency: data.display_currency,
      hasWill: data.has_will,
      hasPoa: data.has_poa,
      hasHcProxy: data.has_hc_proxy,
    },
  });
  return {
    user_id: p.userId,
    age: p.age,
    risk_profile: p.riskProfile as any,
    display_currency: p.displayCurrency,
    has_will: p.hasWill,
    has_poa: p.hasPoa,
    has_hc_proxy: p.hasHcProxy,
  };
}

// ─── Household ────────────────────────────────────────────────────────────────
export async function getHouseholdProfile(userId: string): Promise<HouseholdProfile | undefined> {
  const h = await prisma.householdProfile.findUnique({ where: { userId } });
  if (!h) return undefined;
  const members = await getHouseholdMembers(userId);
  return {
    user_id: h.userId,
    marital_status: h.maritalStatus,
    occupation: h.occupation,
    dependents: members,
  };
}

export async function upsertHouseholdProfile(userId: string, data: Partial<HouseholdProfile>): Promise<HouseholdProfile> {
  const h = await prisma.householdProfile.upsert({
    where: { userId },
    create: {
      userId,
      maritalStatus: data.marital_status ?? 'Single',
      occupation: data.occupation ?? '',
    },
    update: {
      maritalStatus: data.marital_status,
      occupation: data.occupation,
    },
  });
  const members = await getHouseholdMembers(userId);
  return {
    user_id: h.userId,
    marital_status: h.maritalStatus,
    occupation: h.occupation,
    dependents: members,
  };
}

export async function addHouseholdMember(userId: string, member: Omit<HouseholdMember, 'id' | 'user_id'>): Promise<HouseholdMember> {
  const m = await prisma.householdMember.create({
    data: {
      userId,
      relationship: member.relationship,
      name: member.name,
      dob: member.dob,
    },
  });
  return {
    id: m.id,
    user_id: m.userId,
    relationship: m.relationship as any,
    name: m.name,
    dob: m.dob,
  };
}

export async function getHouseholdMembers(userId: string): Promise<HouseholdMember[]> {
  const members = await prisma.householdMember.findMany({ where: { userId } });
  return members.map(m => ({
    id: m.id,
    user_id: m.userId,
    relationship: m.relationship as any,
    name: m.name,
    dob: m.dob,
  }));
}

// ─── Income ───────────────────────────────────────────────────────────────────
export async function getIncomeProfile(userId: string): Promise<IncomeProfile | undefined> {
  const i = await prisma.incomeProfile.findUnique({ where: { userId } });
  if (!i) return undefined;
  return {
    user_id: i.userId,
    salary: toNumber(i.salary),
    business: toNumber(i.business),
    rental: toNumber(i.rental),
    other: toNumber(i.other),
  };
}

export async function upsertIncomeProfile(userId: string, data: Partial<IncomeProfile>): Promise<IncomeProfile> {
  const i = await prisma.incomeProfile.upsert({
    where: { userId },
    create: {
      userId,
      salary: data.salary ?? 0,
      business: data.business ?? 0,
      rental: data.rental ?? 0,
      other: data.other ?? 0,
    },
    update: {
      salary: data.salary,
      business: data.business,
      rental: data.rental,
      other: data.other,
    },
  });
  return {
    user_id: i.userId,
    salary: toNumber(i.salary),
    business: toNumber(i.business),
    rental: toNumber(i.rental),
    other: toNumber(i.other),
  };
}

// ─── Insurance ────────────────────────────────────────────────────────────────
export async function getInsuranceProfile(userId: string): Promise<InsuranceProfile | undefined> {
  const i = await prisma.insuranceProfile.findUnique({ where: { userId } });
  if (!i) return undefined;
  return {
    user_id: i.userId,
    life_coverage: toNumber(i.lifeCoverage),
    health_coverage: toNumber(i.healthCoverage),
    disability_coverage_monthly: toNumber(i.disabilityCoverageMonthly),
    has_long_term_care: i.hasLongTermCare,
  };
}

export async function upsertInsuranceProfile(userId: string, data: Partial<InsuranceProfile>): Promise<InsuranceProfile> {
  const i = await prisma.insuranceProfile.upsert({
    where: { userId },
    create: {
      userId,
      lifeCoverage: data.life_coverage ?? 0,
      healthCoverage: data.health_coverage ?? 0,
      disabilityCoverageMonthly: data.disability_coverage_monthly ?? 0,
      hasLongTermCare: data.has_long_term_care ?? false,
    },
    update: {
      lifeCoverage: data.life_coverage,
      healthCoverage: data.health_coverage,
      disabilityCoverageMonthly: data.disability_coverage_monthly,
      hasLongTermCare: data.has_long_term_care,
    },
  });
  return {
    user_id: i.userId,
    life_coverage: toNumber(i.lifeCoverage),
    health_coverage: toNumber(i.healthCoverage),
    disability_coverage_monthly: toNumber(i.disabilityCoverageMonthly),
    has_long_term_care: i.hasLongTermCare,
  };
}

// ─── Assumptions ─────────────────────────────────────────────────────────────
export async function getAssumptions(userId: string): Promise<Assumptions> {
  let a = await prisma.assumptions.findUnique({ where: { userId } });
  if (!a) {
    a = await prisma.assumptions.create({
      data: {
        userId,
        inflationRate: 0.03,
        expectedReturn: 0.07,
        retirementInflation: 0.04,
        educationInflation: 0.06,
      },
    });
  }
  return {
    user_id: a.userId,
    inflation_rate: toNumber(a.inflationRate),
    expected_return: toNumber(a.expectedReturn),
    retirement_inflation: toNumber(a.retirementInflation),
    education_inflation: toNumber(a.educationInflation),
  };
}

export async function upsertAssumptions(userId: string, data: Partial<Assumptions>): Promise<Assumptions> {
  const a = await prisma.assumptions.upsert({
    where: { userId },
    create: {
      userId,
      inflationRate: data.inflation_rate ?? 0.03,
      expectedReturn: data.expected_return ?? 0.07,
      retirementInflation: data.retirement_inflation ?? 0.04,
      educationInflation: data.education_inflation ?? 0.06,
    },
    update: {
      inflationRate: data.inflation_rate,
      expectedReturn: data.expected_return,
      retirementInflation: data.retirement_inflation,
      educationInflation: data.education_inflation,
    },
  });
  return {
    user_id: a.userId,
    inflation_rate: toNumber(a.inflationRate),
    expected_return: toNumber(a.expectedReturn),
    retirement_inflation: toNumber(a.retirementInflation),
    education_inflation: toNumber(a.educationInflation),
  };
}

// ─── Institutions ─────────────────────────────────────────────────────────────
export async function getInstitutions(userId: string): Promise<Institution[]> {
  const list = await prisma.institution.findMany({ where: { userId } });
  return list.map(i => ({
    id: i.id,
    user_id: i.userId,
    name: i.name,
    type: i.type,
  }));
}

export async function createInstitution(userId: string, data: Omit<Institution, 'id' | 'user_id'>): Promise<Institution> {
  const i = await prisma.institution.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
    },
  });
  return { id: i.id, user_id: i.userId, name: i.name, type: i.type };
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
export async function getAccounts(userId: string): Promise<Account[]> {
  const list = await prisma.account.findMany({ where: { userId } });
  return list.map(a => ({
    id: a.id,
    user_id: a.userId,
    institution_id: a.institutionId,
    name: a.name,
    type: a.type as any,
  }));
}

export async function createAccount(userId: string, data: Omit<Account, 'id' | 'user_id'>): Promise<Account> {
  const a = await prisma.account.create({
    data: {
      userId,
      institutionId: data.institution_id,
      name: data.name,
      type: data.type,
    },
  });
  return { id: a.id, user_id: a.userId, institution_id: a.institutionId, name: a.name, type: a.type as any };
}

// ─── Holdings ─────────────────────────────────────────────────────────────────
export async function getHoldings(userId: string): Promise<Holding[]> {
  const list = await prisma.holding.findMany({ where: { userId } });
  return list.map(h => ({
    id: h.id,
    user_id: h.userId,
    account_id: h.accountId,
    name: h.name,
    category: h.category as any,
    current_value: toNumber(h.currentValue),
    is_liquid: h.isLiquid,
  }));
}

export async function createHolding(userId: string, data: Omit<Holding, 'id' | 'user_id'>): Promise<Holding> {
  const h = await prisma.holding.create({
    data: {
      userId,
      accountId: data.account_id,
      name: data.name,
      category: data.category,
      currentValue: data.current_value,
      isLiquid: data.is_liquid,
    },
  });
  return {
    id: h.id,
    user_id: h.userId,
    account_id: h.accountId,
    name: h.name,
    category: h.category as any,
    current_value: toNumber(h.currentValue),
    is_liquid: h.isLiquid,
  };
}

// ─── Liabilities ──────────────────────────────────────────────────────────────
export async function getLiabilities(userId: string): Promise<Liability[]> {
  const list = await prisma.liability.findMany({ where: { userId } });
  return list.map(l => ({
    id: l.id,
    user_id: l.userId,
    name: l.name,
    category: l.category as any,
    outstanding_balance: toNumber(l.outstandingBalance),
    interest_rate: toNumber(l.interestRate),
    monthly_payment: toNumber(l.monthlyPayment),
  }));
}

export async function createLiability(userId: string, data: Omit<Liability, 'id' | 'user_id'>): Promise<Liability> {
  const l = await prisma.liability.create({
    data: {
      userId,
      name: data.name,
      category: data.category,
      outstandingBalance: data.outstanding_balance,
      interestRate: data.interest_rate,
      monthlyPayment: data.monthly_payment,
    },
  });
  return {
    id: l.id,
    user_id: l.userId,
    name: l.name,
    category: l.category as any,
    outstanding_balance: toNumber(l.outstandingBalance),
    interest_rate: toNumber(l.interestRate),
    monthly_payment: toNumber(l.monthlyPayment),
  };
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export async function getGoals(userId: string): Promise<Goal[]> {
  const list = await prisma.goal.findMany({ where: { userId } });
  return list.map(g => ({
    id: g.id,
    user_id: g.userId,
    name: g.name,
    category: g.category as any,
    priority: g.priority as any,
    target_amount: toNumber(g.targetAmount),
    target_year: g.targetYear,
    already_saved: toNumber(g.alreadySaved),
    monthly_contribution: toNumber(g.monthlyContribution),
    shortfall: toNumber(g.shortfall),
    created_at: g.createdAt.toISOString(),
    updated_at: g.updatedAt.toISOString(),
  }));
}

export async function getGoalById(userId: string, goalId: string): Promise<Goal | undefined> {
  const g = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!g || g.userId !== userId) return undefined;
  return {
    id: g.id,
    user_id: g.userId,
    name: g.name,
    category: g.category as any,
    priority: g.priority as any,
    target_amount: toNumber(g.targetAmount),
    target_year: g.targetYear,
    already_saved: toNumber(g.alreadySaved),
    monthly_contribution: toNumber(g.monthlyContribution),
    shortfall: toNumber(g.shortfall),
    created_at: g.createdAt.toISOString(),
    updated_at: g.updatedAt.toISOString(),
  };
}

export async function createGoal(userId: string, data: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Goal> {
  const g = await prisma.goal.create({
    data: {
      userId,
      name: data.name,
      category: data.category,
      priority: data.priority,
      targetAmount: data.target_amount,
      targetYear: data.target_year,
      alreadySaved: data.already_saved,
      monthlyContribution: data.monthly_contribution,
      shortfall: data.shortfall || 0,
    },
  });
  return {
    id: g.id,
    user_id: g.userId,
    name: g.name,
    category: g.category as any,
    priority: g.priority as any,
    target_amount: toNumber(g.targetAmount),
    target_year: g.targetYear,
    already_saved: toNumber(g.alreadySaved),
    monthly_contribution: toNumber(g.monthlyContribution),
    shortfall: toNumber(g.shortfall),
    created_at: g.createdAt.toISOString(),
    updated_at: g.updatedAt.toISOString(),
  };
}

export async function updateGoal(userId: string, goalId: string, data: Partial<Goal>): Promise<Goal | null> {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.target_amount !== undefined) updateData.targetAmount = data.target_amount;
  if (data.target_year !== undefined) updateData.targetYear = data.target_year;
  if (data.already_saved !== undefined) updateData.alreadySaved = data.already_saved;
  if (data.monthly_contribution !== undefined) updateData.monthlyContribution = data.monthly_contribution;
  if (data.shortfall !== undefined) updateData.shortfall = data.shortfall;

  try {
    const g = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });
    if (g.userId !== userId) return null;
    return {
      id: g.id,
      user_id: g.userId,
      name: g.name,
      category: g.category as any,
      priority: g.priority as any,
      target_amount: toNumber(g.targetAmount),
      target_year: g.targetYear,
      already_saved: toNumber(g.alreadySaved),
      monthly_contribution: toNumber(g.monthlyContribution),
      shortfall: toNumber(g.shortfall),
      created_at: g.createdAt.toISOString(),
      updated_at: g.updatedAt.toISOString(),
    };
  } catch (e) {
    return null; // Handle Not Found
  }
}

export async function deleteGoal(userId: string, goalId: string): Promise<boolean> {
  try {
    const g = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!g || g.userId !== userId) return false;
    await prisma.goal.delete({ where: { id: goalId } });
    return true;
  } catch (e) {
    return false;
  }
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export async function getRecommendations(userId: string): Promise<RecommendationAlert[]> {
  const list = await prisma.recommendationAlert.findMany({
    where: { userId, status: 'Active' },
  });
  return list.map(r => ({
    id: r.id,
    user_id: r.userId,
    category: r.category,
    priority: r.priority as AlertPriority,
    alert_message: r.alertMessage,
    reason: r.reason,
    expected_benefit: r.expectedBenefit,
    action: r.action,
    related_goal_id: r.relatedGoalId || undefined,
    status: r.status as AlertStatus,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function replaceRecommendations(userId: string, newRecs: Omit<RecommendationAlert, 'id' | 'created_at' | 'status'>[]): Promise<RecommendationAlert[]> {
  // Delete all active recs in transaction and recreate
  const results = await prisma.$transaction(async (tx) => {
    await tx.recommendationAlert.deleteMany({
      where: { userId },
    });
    
    const created = await Promise.all(newRecs.map(r => tx.recommendationAlert.create({
      data: {
        userId,
        category: r.category,
        priority: r.priority,
        alertMessage: r.alert_message,
        reason: r.reason,
        expectedBenefit: r.expected_benefit,
        action: r.action,
        relatedGoalId: r.related_goal_id,
        status: 'Active',
      }
    })));
    return created;
  });

  return results.map(r => ({
    id: r.id,
    user_id: r.userId,
    category: r.category,
    priority: r.priority as AlertPriority,
    alert_message: r.alertMessage,
    reason: r.reason,
    expected_benefit: r.expectedBenefit,
    action: r.action,
    related_goal_id: r.relatedGoalId || undefined,
    status: r.status as AlertStatus,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function updateRecommendationStatus(userId: string, recId: string, status: AlertStatus): Promise<RecommendationAlert | null> {
  try {
    const r = await prisma.recommendationAlert.findUnique({ where: { id: recId } });
    if (!r || r.userId !== userId) return null;
    const updated = await prisma.recommendationAlert.update({
      where: { id: recId },
      data: { status },
    });
    return {
      id: updated.id,
      user_id: updated.userId,
      category: updated.category,
      priority: updated.priority as AlertPriority,
      alert_message: updated.alertMessage,
      reason: updated.reason,
      expected_benefit: updated.expectedBenefit,
      action: updated.action,
      related_goal_id: updated.relatedGoalId || undefined,
      status: updated.status as AlertStatus,
      created_at: updated.createdAt.toISOString(),
    };
  } catch (e) {
    return null;
  }
}

// ─── Net Worth History ────────────────────────────────────────────────────────
export async function getNetWorthHistory(userId: string) {
  // For now, mock based on current DB values. Real implementation would track historical records.
  const holdings = await getHoldings(userId);
  const liabilities = await getLiabilities(userId);
  const currentNetWorth = holdings.reduce((sum, h) => sum + h.current_value, 0) - liabilities.reduce((sum, l) => sum + l.outstanding_balance, 0);
  
  return Array.from({ length: 6 }).map((_, i) => ({
    date: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    net_worth: currentNetWorth * (0.9 + (i * 0.02)), 
  }));
}

// ─── WHS History ──────────────────────────────────────────────────────────────
export async function getWhsHistory(userId: string) {
  const list = await prisma.whsHistory.findMany({ where: { userId } });
  return list.map(h => ({
    user_id: h.userId,
    score: h.score,
    category: h.category,
    net_worth: toNumber(h.netWorth),
    monthly_savings: toNumber(h.monthlySavings),
    savings_rate: toNumber(h.savingsRate),
    emergency_fund_coverage: toNumber(h.emergencyFundCoverage),
    retirement_readiness: toNumber(h.retirementReadiness),
    goal_funding_status: toNumber(h.goalFundingStatus),
    insurance_adequacy: toNumber(h.insuranceAdequacy),
    debt_ratio: toNumber(h.debtRatio),
    date: h.date,
  }));
}

export async function appendWhsHistory(userId: string, scoreOrData: number | any, category?: string) {
  const data = typeof scoreOrData === 'number' ? { score: scoreOrData, category: category || 'HEALTHY' } : scoreOrData;
  await prisma.whsHistory.create({
    data: {
      userId,
      score: data.score ?? 0,
      category: data.category ?? 'HEALTHY',
      netWorth: data.net_worth || 0,
      monthlySavings: data.monthly_savings || 0,
      savingsRate: data.savings_rate || 0,
      emergencyFundCoverage: data.emergency_fund_coverage || 0,
      retirementReadiness: data.retirement_readiness || 0,
      goalFundingStatus: data.goal_funding_status || 0,
      insuranceAdequacy: data.insurance_adequacy || 0,
      debtRatio: data.debt_ratio || 0,
      date: new Date().toISOString().slice(0, 10),
    }
  });
}

// ─── Advisor → Client ─────────────────────────────────────────────────────────
export async function getAdvisorClients(advisorId: string): Promise<User[]> {
  const consents = await prisma.advisorClientConsent.findMany({ where: { advisorId } });
  const clientIds = consents.map(c => c.clientId);
  const users = await prisma.user.findMany({ where: { id: { in: clientIds } } });
  return users.map(mapUser);
}
