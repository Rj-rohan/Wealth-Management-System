/**
 * API route definitions — Maps HTTP endpoints to controllers.
 * No business logic here. All logic lives in services.
 *
 * Everything under /users/:userId is behind requireAuth + requireSelf, so a
 * single sign-in covers wealth planning and the markets workspace alike.
 */
import { Router } from 'express';
import * as ctrl from '../controllers';
import { requireAuth, requireSelf } from '../middleware/auth';

const router = Router();

// ─── Auth (public) ─────────────────────────────────────────────────────────────
router.post('/auth/login', ctrl.login);
router.post('/auth/register', ctrl.register);

// ─── Risk Questions (public — needed by Step 6 of onboarding) ─────────────────
router.get('/risk-questions', ctrl.getRiskQuestions);

// ─── Investing style preview (classification without persisting) ──────────────
router.post('/investor-profile/classify', requireAuth, ctrl.classifyInvestorPreview);

// ─── Everything account-scoped requires a valid session ───────────────────────
router.use('/users/:userId', requireAuth, requireSelf);

router.patch('/users/:userId/preferences', ctrl.patchUserPreferences);

// ─── Wealth Discovery (Onboarding) ────────────────────────────────────────────
router.post('/users/:userId/wealth-discovery', ctrl.submitWealthDiscovery);

// ─── Investor Profile (investing style + allocation targets) ──────────────────
router.get('/users/:userId/investor-profile', ctrl.getInvestorProfile);
router.put('/users/:userId/investor-profile', ctrl.putInvestorProfile);
router.delete('/users/:userId/investor-profile', ctrl.deleteInvestorProfile);

// ─── WHS ───────────────────────────────────────────────────────────────────────
router.get('/users/:userId/wealth-health-score', ctrl.getWHSSnapshot);

// ─── Net Worth ─────────────────────────────────────────────────────────────────
router.get('/users/:userId/net-worth', ctrl.getNetWorth);

// ─── Goals ─────────────────────────────────────────────────────────────────────
router.get('/users/:userId/goals', ctrl.getGoals);
router.post('/users/:userId/goals', ctrl.createGoal);
router.put('/users/:userId/goals/:goalId', ctrl.updateGoal);
router.patch('/users/:userId/goals/:goalId', ctrl.updateGoal);
router.get('/users/:userId/goals/:goalId/options', ctrl.getGoalOptions);
router.delete('/users/:userId/goals/:goalId', ctrl.deleteGoal);

// ─── Recommendations ───────────────────────────────────────────────────────────
router.get('/users/:userId/recommendations', ctrl.getRecommendations);
router.patch('/users/:userId/recommendations/:recId', ctrl.updateRecommendation);

// ─── Assumptions ───────────────────────────────────────────────────────────────
router.get('/users/:userId/assumptions', ctrl.getAssumptions);

// ─── Advisor ───────────────────────────────────────────────────────────────────
router.get('/advisors/:advisorId/clients', requireAuth, ctrl.getAdvisorClients);

// ─── Investment Management Module (Phase 1) ────────────────────────────────────
router.get('/users/:userId/portfolio/summary', ctrl.getPortfolioSummary);
router.get('/users/:userId/portfolio/performance', ctrl.getPortfolioPerformance);
router.get('/users/:userId/portfolio/allocation', ctrl.getAssetAllocation);
router.get('/users/:userId/portfolio/rebalancing', ctrl.getRebalancingAlerts);

// ─── Portfolio Tracker (self-entered equity positions) ────────────────────────
router.get('/users/:userId/tracker/holdings', ctrl.getTrackerHoldings);
router.post('/users/:userId/tracker/holdings', ctrl.createTrackerHolding);
router.delete('/users/:userId/tracker/holdings/:holdingId', ctrl.deleteTrackerHolding);

// ─── Watchlist (Buffett-scored companies) ─────────────────────────────────────
router.get('/users/:userId/watchlist', ctrl.getWatchlist);
router.post('/users/:userId/watchlist', ctrl.createWatchlistItem);
router.delete('/users/:userId/watchlist/:itemId', ctrl.deleteWatchlistItem);

// ─── AI Advisory Services (RAG-backed) ─────────────────────────────────────────
router.get('/users/:userId/goals/:goalId/coach', ctrl.getAIGoalCoachMessage);
router.get('/users/:userId/retirement-coach', ctrl.getAIRetirementCoachMessage);
router.get('/users/:userId/recommendations/:recId/explain', ctrl.getAIRecommendationExplanation);
router.post('/users/:userId/ai/chat', ctrl.postAIChat);

export default router;
