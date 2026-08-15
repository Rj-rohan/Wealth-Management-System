/**
 * Controller layer — handles HTTP req/res only.
 * No business logic. No financial formulas.
 * Calls services, maps results to responses.
 */
import { Request, Response, NextFunction } from 'express';
import * as svc from '../services';
import * as investorSvc from '../services/investor';

// Wrapper for async Express route handlers to capture errors uniformly
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(`[HTTP ERROR ${req.method} ${req.path}]:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error', detail: err?.message || String(err) });
      }
    });
  };
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = await svc.loginUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  return res.status(200).json(user);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }
  try {
    const user = await svc.registerUser(email, password, name);
    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export const patchUserPreferences = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { display_currency } = req.body;
  const result = await svc.updateUserPreferences(userId, { display_currency });
  return res.status(200).json(result);
});

// ─── Risk Questions ────────────────────────────────────────────────────────────
export const getRiskQuestions = asyncHandler(async (_req: Request, res: Response) => {
  return res.status(200).json(svc.getRiskQuestions());
});

// ─── Wealth Discovery ──────────────────────────────────────────────────────────
export const submitWealthDiscovery = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const snapshot = await svc.submitWealthDiscovery(userId, req.body);
  return res.status(200).json(snapshot);
});

// ─── WHS ───────────────────────────────────────────────────────────────────────
export const getWHSSnapshot = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await svc.getWHSSnapshot(req.params.userId);
  if (!snapshot) return res.status(404).json({ error: 'Profile not found.' });
  return res.status(200).json(snapshot);
});

// ─── Net Worth ─────────────────────────────────────────────────────────────────
export const getNetWorth = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getNetWorth(req.params.userId);
  return res.status(200).json(data);
});

// ─── Goals ─────────────────────────────────────────────────────────────────────
export const getGoals = asyncHandler(async (req: Request, res: Response) => {
  const goals = await svc.getGoals(req.params.userId);
  return res.status(200).json(goals);
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, category, priority, target_amount, target_year, already_saved, monthly_contribution } = req.body;
  if (!name || !category || !target_amount || !target_year) {
    return res.status(400).json({ error: 'name, category, target_amount, and target_year are required.' });
  }
  const goal = await svc.createGoal(userId, {
    name, category, priority: priority ?? 'Medium',
    target_amount: Number(target_amount),
    target_year: Number(target_year),
    already_saved: Number(already_saved ?? 0),
    monthly_contribution: Number(monthly_contribution ?? 0),
  });
  return res.status(201).json(goal);
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const { userId, goalId } = req.params;
  const { name, category, priority, target_amount, target_year, already_saved, monthly_contribution } = req.body;
  const updated = await svc.updateGoal(userId, goalId, {
    name,
    category,
    priority,
    target_amount: target_amount !== undefined ? Number(target_amount) : undefined,
    target_year: target_year !== undefined ? Number(target_year) : undefined,
    already_saved: already_saved !== undefined ? Number(already_saved) : undefined,
    monthly_contribution: monthly_contribution !== undefined ? Number(monthly_contribution) : undefined,
  });
  if (!updated) return res.status(404).json({ error: 'Goal not found.' });
  return res.status(200).json(updated);
});

export const getGoalOptions = asyncHandler(async (req: Request, res: Response) => {
  const { userId, goalId } = req.params;
  const options = await svc.getGoalOptions(userId, goalId);
  if (!options) return res.status(404).json({ error: 'Goal not found or has no shortfall.' });
  return res.status(200).json(options);
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const { userId, goalId } = req.params;
  const success = await svc.deleteGoal(userId, goalId);
  if (!success) return res.status(404).json({ error: 'Goal not found.' });
  return res.status(204).send();
});

// ─── Recommendations ───────────────────────────────────────────────────────────
export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const recs = await svc.getRecommendations(req.params.userId);
  return res.status(200).json(recs);
});

export const updateRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const { userId, recId } = req.params;
  const { status } = req.body;
  const result = await svc.updateRecommendation(userId, recId, status);
  if (!result) return res.status(404).json({ error: 'Recommendation not found.' });
  return res.status(200).json(result);
});

// ─── Assumptions ───────────────────────────────────────────────────────────────
export const getAssumptions = asyncHandler(async (req: Request, res: Response) => {
  const assumptions = await svc.getAssumptions(req.params.userId);
  return res.status(200).json(assumptions);
});

// ─── Advisor ───────────────────────────────────────────────────────────────────
export const getAdvisorClients = asyncHandler(async (req: Request, res: Response) => {
  const clients = await svc.getAdvisorClients(req.params.advisorId);
  return res.status(200).json(clients);
});

// ─── Investment Management Module (Phase 1) ────────────────────────────────────

export const getPortfolioSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getPortfolioSummary(req.params.userId);
  return res.status(200).json(data);
});

export const getPortfolioPerformance = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getPortfolioPerformance(req.params.userId);
  return res.status(200).json(data);
});

export const getAssetAllocation = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getAssetAllocation(req.params.userId);
  return res.status(200).json(data);
});

export const getRebalancingAlerts = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getRebalancingAlerts(req.params.userId);
  return res.status(200).json(data);
});

// ─── Investor Profile ──────────────────────────────────────────────────────────

/**
 * Classifies a set of answers without saving them, so the onboarding wizard can
 * show the investor type live. Classification stays server-side — one
 * implementation, no client copy to drift.
 */
export const classifyInvestorPreview = asyncHandler(async (req: Request, res: Response) => {
  const { age, riskAppetite, horizon, monthlyInvestment, goal } = req.body;
  if (age === undefined || !riskAppetite || horizon === undefined || !goal) {
    return res.status(400).json({ error: 'age, riskAppetite, horizon, and goal are required.' });
  }
  return res.status(200).json(
    investorSvc.classifyInvestor({
      age: Number(age),
      riskAppetite,
      horizon: Number(horizon),
      monthlyInvestment: Number(monthlyInvestment ?? 0),
      goal,
    })
  );
});

export const getInvestorProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await investorSvc.getInvestorProfile(req.params.userId);
  if (!profile) return res.status(404).json({ error: 'Investor profile not set.' });
  return res.status(200).json(profile);
});

export const putInvestorProfile = asyncHandler(async (req: Request, res: Response) => {
  const { age, riskAppetite, horizon, monthlyInvestment, goal, existingPortfolio } = req.body;
  if (age === undefined || !riskAppetite || horizon === undefined || !goal) {
    return res.status(400).json({ error: 'age, riskAppetite, horizon, and goal are required.' });
  }
  const profile = await investorSvc.saveInvestorProfile(req.params.userId, {
    age: Number(age),
    riskAppetite,
    horizon: Number(horizon),
    monthlyInvestment: Number(monthlyInvestment ?? 0),
    goal,
    existingPortfolio: Number(existingPortfolio ?? 0),
  });
  return res.status(200).json(profile);
});

export const deleteInvestorProfile = asyncHandler(async (req: Request, res: Response) => {
  await investorSvc.deleteInvestorProfile(req.params.userId);
  return res.status(204).send();
});

// ─── Portfolio Tracker ─────────────────────────────────────────────────────────

export const getTrackerHoldings = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200).json(await investorSvc.listTrackerHoldings(req.params.userId));
});

export const createTrackerHolding = asyncHandler(async (req: Request, res: Response) => {
  const { ticker, qty, buyPrice, currentPrice } = req.body;
  if (!ticker || qty === undefined || buyPrice === undefined || currentPrice === undefined) {
    return res.status(400).json({ error: 'ticker, qty, buyPrice, and currentPrice are required.' });
  }
  if (Number(qty) <= 0 || Number(buyPrice) <= 0 || Number(currentPrice) < 0) {
    return res.status(400).json({ error: 'qty and buyPrice must be positive numbers.' });
  }
  const holding = await investorSvc.addTrackerHolding(req.params.userId, {
    ticker: String(ticker),
    qty: Number(qty),
    buyPrice: Number(buyPrice),
    currentPrice: Number(currentPrice),
  });
  return res.status(201).json(holding);
});

export const deleteTrackerHolding = asyncHandler(async (req: Request, res: Response) => {
  const ok = await investorSvc.deleteTrackerHolding(req.params.userId, req.params.holdingId);
  if (!ok) return res.status(404).json({ error: 'Holding not found.' });
  return res.status(204).send();
});

// ─── Watchlist ─────────────────────────────────────────────────────────────────

export const getWatchlist = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200).json(await investorSvc.listWatchlist(req.params.userId));
});

export const createWatchlistItem = asyncHandler(async (req: Request, res: Response) => {
  const { companyName, score, rating, date } = req.body;
  if (!companyName || score === undefined || !rating) {
    return res.status(400).json({ error: 'companyName, score, and rating are required.' });
  }
  const item = await investorSvc.addWatchlistItem(req.params.userId, {
    companyName: String(companyName),
    score: Number(score),
    rating: String(rating),
    date,
  });
  return res.status(201).json(item);
});

export const deleteWatchlistItem = asyncHandler(async (req: Request, res: Response) => {
  const ok = await investorSvc.deleteWatchlistItem(req.params.userId, req.params.itemId);
  if (!ok) return res.status(404).json({ error: 'Watchlist item not found.' });
  return res.status(204).send();
});

// ─── AI Advisory Services (Modules 1.1, 1.2, 1.3) ──────────────────────────────

export const getAIGoalCoachMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getAIGoalCoachMessage(req.params.userId, req.params.goalId);
  if (!data) return res.status(404).json({ error: 'Goal or shortfall not found.' });
  return res.status(200).json(data);
});

export const getAIRetirementCoachMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getAIRetirementCoachMessage(req.params.userId);
  return res.status(200).json(data);
});

export const getAIRecommendationExplanation = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getAIRecommendationExplanation(req.params.userId, req.params.recId);
  if (!data) return res.status(404).json({ error: 'Recommendation not found.' });
  return res.status(200).json(data);
});

export const postAIChat = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  const data = await svc.chatWithAdvisor(userId, message, chatHistory || []);
  return res.status(200).json(data);
});
