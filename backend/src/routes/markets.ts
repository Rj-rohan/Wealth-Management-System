/**
 * Market-intelligence API routes.
 *
 * These endpoints back the Markets workspace (Market Pulse, AI CFO, Risk Radar,
 * Branch Intelligence, Treasury Autopilot, Smart Reports). They were originally
 * Next.js route handlers; the paths are preserved verbatim so the screens keep
 * calling the same URLs.
 *
 * Mounted at /api — i.e. /api/market/quotes, /api/ai-cfo/chat, and so on.
 * The wealth-planning API remains under /api/v1.
 */

import { Router } from 'express';
import { asyncHandler } from '../controllers';
import * as market from '../services/market';
import * as risk from '../services/risk';
import * as treasury from '../services/treasury';
import * as branches from '../services/branches';
import * as reports from '../services/reports';
import { streamCfoReply } from '../services/aiCfo';

const router = Router();

// ─── Market data ───────────────────────────────────────────────────────────────
router.get('/market/quotes', asyncHandler(async (req, res) => {
  const symbols = String(req.query.symbols || '');
  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }
  const symbolList = symbols.split(',').map((s) => s.trim()).filter(Boolean);
  return res.status(200).json(await market.getQuotes(symbolList));
}));

router.get('/market/news', asyncHandler(async (_req, res) => {
  return res.status(200).json(await market.getMarketNews());
}));

// ─── AI CFO (streaming) ────────────────────────────────────────────────────────
router.post('/ai-cfo/chat', asyncHandler(async (req, res) => {
  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.flushHeaders?.();

  try {
    for await (const delta of streamCfoReply(
      messages.map((m: any) => ({ role: m.role, content: m.content })),
      context
    )) {
      res.write(delta);
    }
  } catch (err) {
    console.error('AI CFO stream error:', err);
  }
  return res.end();
}));

// ─── Risk Radar ────────────────────────────────────────────────────────────────
router.post('/risk/stress-test', asyncHandler(async (req, res) => {
  const { scenario, customParams, holdings } = req.body;
  if (!scenario) {
    return res.status(400).json({ error: 'Scenario is required' });
  }
  try {
    const result = await risk.runStressTest(scenario, customParams, holdings);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof risk.UnknownScenarioError) {
      return res.status(400).json({ error: 'Unknown scenario' });
    }
    throw err;
  }
}));

// ─── Branch Intelligence ───────────────────────────────────────────────────────
router.get('/branches/financial-summary', asyncHandler(async (_req, res) => {
  return res.status(200).json(branches.getBranchFinancialSummary());
}));

// ─── Treasury Autopilot ────────────────────────────────────────────────────────
router.get('/treasury/forecast', asyncHandler(async (req, res) => {
  const days = parseInt(String(req.query.days || '90'), 10);
  const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 1), 365) : 90;
  return res.status(200).json(treasury.buildForecast(safeDays));
}));

router.post('/treasury/narrative', asyncHandler(async (req, res) => {
  return res.status(200).json(await treasury.buildNarrative(req.body?.forecastData));
}));

// ─── Smart Reports ─────────────────────────────────────────────────────────────
router.post('/reports/generate', asyncHandler(async (req, res) => {
  const { reportType, period, companyData } = req.body;
  if (!reportType || !period) {
    return res.status(400).json({ error: 'reportType and period are required' });
  }
  return res.status(200).json(await reports.generateReport(reportType, period, companyData));
}));

router.get('/reports/download', asyncHandler(async (req, res) => {
  const raw = req.query.data;
  if (!raw) {
    return res.status(400).json({ error: 'Report data is required' });
  }
  let reportData;
  try {
    reportData = JSON.parse(decodeURIComponent(String(raw)));
  } catch {
    return res.status(400).json({ error: 'Invalid report data' });
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(reports.renderReportHtml(reportData));
}));

export default router;
