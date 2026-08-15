/**
 * Investor profile — investing style classification and persistence.
 *
 * `classifyInvestor` was originally a client-side function in the Next.js
 * UserContext. It moved to the server during the merge so the classification
 * that drives screener thresholds, budget-aware suggestions and letter
 * filtering has exactly one implementation, and so the profile survives a
 * change of browser.
 *
 * The rules and thresholds are unchanged from the original implementation.
 */

import { prisma } from '../repositories/prisma';

export type RiskAppetite = 'low' | 'medium' | 'high';

export interface InvestorInputs {
  age: number;
  riskAppetite: RiskAppetite | string;
  horizon: number;
  monthlyInvestment: number;
  goal: string;
  existingPortfolio?: number;
}

export interface InvestorClassification {
  type: string;
  icon: string;
  desc: string;
  allocation: { equity: number; debt: number; gold: number };
  buffettAdvice: string;
  maxStockPE: number;
  minDividendYield: number;
}

export interface InvestorProfileDto extends InvestorInputs {
  existingPortfolio: number;
  investor: InvestorClassification;
}

export function classifyInvestor(profile: InvestorInputs): InvestorClassification {
  const { age, riskAppetite, horizon, goal } = profile;

  if (riskAppetite === 'low' || horizon <= 2) {
    return {
      type: 'Conservative',
      icon: '🛡️',
      desc: 'Capital preservation with steady returns. Focus on dividends and large-caps.',
      allocation: { equity: 30, debt: 60, gold: 10 },
      buffettAdvice: 'Stick to businesses you understand. Margin of safety is your best friend.',
      maxStockPE: 20,
      minDividendYield: 2,
    };
  }
  if (riskAppetite === 'high' && age < 35 && horizon >= 7) {
    return {
      type: 'Aggressive Growth',
      icon: '🚀',
      desc: 'High-conviction bets on quality compounders. Long horizon allows volatility.',
      allocation: { equity: 85, debt: 10, gold: 5 },
      buffettAdvice: 'Time in the market beats timing the market. Buy wonderful businesses and hold.',
      maxStockPE: 45,
      minDividendYield: 0,
    };
  }
  if (goal === 'retirement') {
    return {
      type: 'Wealth Builder',
      icon: '🏦',
      desc: 'Long-term compounding for retirement. Balanced quality equity with some debt.',
      allocation: { equity: 65, debt: 30, gold: 5 },
      buffettAdvice: 'Compound interest is the 8th wonder. Start early, stay consistent.',
      maxStockPE: 35,
      minDividendYield: 1,
    };
  }
  return {
    type: 'Balanced',
    icon: '⚖️',
    desc: 'Mix of growth and safety. Quality large and mid-caps with moderate risk.',
    allocation: { equity: 55, debt: 35, gold: 10 },
    buffettAdvice: 'Diversification is protection against ignorance. Know what you own.',
    maxStockPE: 30,
    minDividendYield: 1,
  };
}

function toDto(row: any): InvestorProfileDto {
  return {
    age: row.age,
    riskAppetite: row.riskAppetite,
    horizon: row.horizon,
    monthlyInvestment: Number(row.monthlyInvestment),
    goal: row.goal,
    existingPortfolio: Number(row.existingPortfolio),
    investor: {
      type: row.type,
      icon: row.icon,
      desc: row.description,
      allocation: {
        equity: row.equityAllocation,
        debt: row.debtAllocation,
        gold: row.goldAllocation,
      },
      buffettAdvice: row.buffettAdvice,
      maxStockPE: row.maxStockPe,
      minDividendYield: Number(row.minDividendYield),
    },
  };
}

export async function getInvestorProfile(userId: string): Promise<InvestorProfileDto | null> {
  const row = await prisma.investorProfile.findUnique({ where: { userId } });
  return row ? toDto(row) : null;
}

export async function saveInvestorProfile(
  userId: string,
  inputs: InvestorInputs
): Promise<InvestorProfileDto> {
  const investor = classifyInvestor(inputs);

  const data = {
    age: Number(inputs.age),
    riskAppetite: String(inputs.riskAppetite),
    horizon: Number(inputs.horizon),
    monthlyInvestment: Number(inputs.monthlyInvestment) || 0,
    goal: String(inputs.goal),
    existingPortfolio: Number(inputs.existingPortfolio) || 0,
    type: investor.type,
    icon: investor.icon,
    description: investor.desc,
    buffettAdvice: investor.buffettAdvice,
    equityAllocation: investor.allocation.equity,
    debtAllocation: investor.allocation.debt,
    goldAllocation: investor.allocation.gold,
    maxStockPe: investor.maxStockPE,
    minDividendYield: investor.minDividendYield,
  };

  const row = await prisma.investorProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return toDto(row);
}

export async function deleteInvestorProfile(userId: string): Promise<void> {
  await prisma.investorProfile.deleteMany({ where: { userId } });
}

// ─── Portfolio Tracker holdings ────────────────────────────────────────────────

export interface TrackerHoldingDto {
  id: string;
  ticker: string;
  qty: number;
  buyPrice: number;
  currentPrice: number;
}

function toTrackerDto(row: any): TrackerHoldingDto {
  return {
    id: row.id,
    ticker: row.ticker,
    qty: Number(row.quantity),
    buyPrice: Number(row.buyPrice),
    currentPrice: Number(row.currentPrice),
  };
}

export async function listTrackerHoldings(userId: string): Promise<TrackerHoldingDto[]> {
  const rows = await prisma.trackerHolding.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toTrackerDto);
}

export async function addTrackerHolding(
  userId: string,
  input: { ticker: string; qty: number; buyPrice: number; currentPrice: number }
): Promise<TrackerHoldingDto> {
  const row = await prisma.trackerHolding.create({
    data: {
      userId,
      ticker: input.ticker.trim().toUpperCase(),
      quantity: input.qty,
      buyPrice: input.buyPrice,
      currentPrice: input.currentPrice,
    },
  });
  return toTrackerDto(row);
}

export async function deleteTrackerHolding(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.trackerHolding.deleteMany({ where: { id, userId } });
  return count > 0;
}

// ─── Watchlist ─────────────────────────────────────────────────────────────────

export interface WatchlistItemDto {
  id: string;
  companyName: string;
  score: number;
  rating: string;
  date: string;
}

function toWatchlistDto(row: any): WatchlistItemDto {
  return {
    id: row.id,
    companyName: row.companyName,
    score: row.score,
    rating: row.rating,
    date: row.assessedOn,
  };
}

export async function listWatchlist(userId: string): Promise<WatchlistItemDto[]> {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toWatchlistDto);
}

export async function addWatchlistItem(
  userId: string,
  input: { companyName: string; score: number; rating: string; date?: string }
): Promise<WatchlistItemDto> {
  const row = await prisma.watchlistItem.create({
    data: {
      userId,
      companyName: input.companyName,
      score: Math.round(input.score),
      rating: input.rating,
      assessedOn: input.date || new Date().toLocaleDateString('en-IN'),
    },
  });
  return toWatchlistDto(row);
}

export async function deleteWatchlistItem(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.watchlistItem.deleteMany({ where: { id, userId } });
  return count > 0;
}
