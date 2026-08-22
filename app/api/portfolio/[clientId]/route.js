import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  let p = await db.findOne("portfolio_data", { client_id: clientId });
  if (!p) {
    const defaultHoldings = [
      { id: `hold_${clientId}_0`, type: "stock", name: "Reliance Industries", ticker: "RELIANCE", sector: "Energy", geography: "India", costBasis: 25000, currentValue: 32000, returnPct: 28.0, quantity: 15, riskLevel: "medium", timeHorizon: "long", liquidity: "high" },
      { id: `hold_${clientId}_1`, type: "stock", name: "Tata Consultancy Services", ticker: "TCS", sector: "Technology", geography: "India", costBasis: 30000, currentValue: 35500, returnPct: 18.3, quantity: 10, riskLevel: "low", timeHorizon: "long", liquidity: "high" },
      { id: `hold_${clientId}_2`, type: "stock", name: "HDFC Bank", ticker: "HDFCBANK", sector: "Financial Services", geography: "India", costBasis: 20000, currentValue: 22000, returnPct: 10.0, quantity: 15, riskLevel: "low", timeHorizon: "medium", liquidity: "high" },
      { id: `hold_${clientId}_3`, type: "mutual_fund", name: "Parag Parikh Flexi Cap Fund", ticker: "PPFCF", sector: "Diversified", geography: "India", costBasis: 40000, currentValue: 48000, returnPct: 20.0, quantity: 1200, riskLevel: "medium", timeHorizon: "long", liquidity: "medium" },
      { id: `hold_${clientId}_4`, type: "etf", name: "Nippon India Nifty 50 BeES", ticker: "NIFTYBEES", sector: "Index", geography: "India", costBasis: 35000, currentValue: 39000, returnPct: 11.4, quantity: 150, riskLevel: "low", timeHorizon: "long", liquidity: "high" },
      { id: `hold_${clientId}_5`, type: "gold", name: "Sovereign Gold Bond / Gold ETF", ticker: "GOLDBEES", sector: "Commodities", geography: "India", costBasis: 15000, currentValue: 17500, returnPct: 16.7, quantity: 30, riskLevel: "low", timeHorizon: "long", liquidity: "medium" },
    ];

    const totalCost = defaultHoldings.reduce((s, h) => s + h.costBasis, 0);
    const totalValue = defaultHoldings.reduce((s, h) => s + h.currentValue, 0);
    const totalReturn = Number(((totalValue / Math.max(1, totalCost) - 1) * 100).toFixed(1));

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const performanceHistory = [];
    let runningVal = totalCost * 0.9;
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      runningVal = Math.round(runningVal * 1.02);
      performanceHistory.push({
        month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        value: runningVal,
        benchmark: Math.round(totalCost * (1 + (12 - m) * 0.008)),
      });
    }

    const analysis = {
      diversificationScore: 82,
      riskScore: 65,
      volatility: 12.4,
      allocationDrift: 4.2,
      concentrationRisk: "low",
      sharpeRatio: 1.45,
    };

    p = await db.insert("portfolio_data", {
      client_id: clientId,
      holdings: defaultHoldings,
      performance_history: performanceHistory,
      analysis,
      total_value: totalValue,
      total_cost: totalCost,
      total_return: totalReturn,
    });
  }

  const holdings = typeof p.holdings === "string" ? JSON.parse(p.holdings) : p.holdings || [];
  const performanceHistory = typeof p.performance_history === "string" ? JSON.parse(p.performance_history) : p.performance_history || [];
  const analysis = typeof p.analysis === "string" ? JSON.parse(p.analysis) : p.analysis || {};

  return ok({
    clientId: p.client_id,
    holdings,
    performanceHistory,
    analysis,
    totalValue: Number(p.total_value || 0),
    totalCost: Number(p.total_cost || 0),
    totalReturn: Number(p.total_return || 0),
  });
}
