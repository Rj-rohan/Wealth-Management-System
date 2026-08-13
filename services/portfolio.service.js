import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay } from "./mockUtil";

export const portfolioService = {
  async getHoldings(clientId) {
    await delay(280);
    const p = dataset.portfolios.find((p) => p.clientId === clientId);
    if (!p) return null;
    return clone(p.holdings);
  },

  async getAllocation(clientId) {
    await delay(220);
    const p = dataset.portfolios.find((p) => p.clientId === clientId);
    if (!p) return null;
    const byType = {};
    p.holdings.forEach((h) => {
      const key = h.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      byType[key] = (byType[key] || 0) + h.currentValue;
    });
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  },

  async getSectorAllocation(clientId) {
    await delay(220);
    const p = dataset.portfolios.find((p) => p.clientId === clientId);
    if (!p) return null;
    const bySector = {};
    p.holdings.forEach((h) => {
      bySector[h.sector] = (bySector[h.sector] || 0) + h.currentValue;
    });
    return Object.entries(bySector).map(([name, value]) => ({ name, value }));
  },

  async getGeographicAllocation(clientId) {
    await delay(200);
    const p = dataset.portfolios.find((p) => p.clientId === clientId);
    if (!p) return null;
    const byGeo = {};
    p.holdings.forEach((h) => {
      byGeo[h.geography] = (byGeo[h.geography] || 0) + h.currentValue;
    });
    return Object.entries(byGeo).map(([name, value]) => ({ name, value }));
  },

  async getPerformance(clientId) {
    await delay(250);
    const p = dataset.portfolios.find((p) => p.clientId === clientId);
    if (!p) return null;
    return clone(p.performanceHistory);
  },

  async getAnalysis(clientId) {
    await delay(230);
    const p = dataset.portfolios.find((p) => p.clientId === clientId);
    if (!p) return null;
    return clone({
      totalValue: p.totalValue,
      totalCost: p.totalCost,
      totalReturn: p.totalReturn,
      ...p.analysis,
    });
  },

  async getRecommendations(clientId) {
    await delay(250);
    const p = dataset.portfolios.find((pt) => pt.clientId === clientId);
    if (!p) return [];
    const recs = [];
    p.holdings.forEach((h) => {
      if (h.returnPct > 20) recs.push({ holdingId: h.id, name: h.name, action: "hold", reason: "Strong performer — maintain position" });
      else if (h.returnPct < -5) recs.push({ holdingId: h.id, name: h.name, action: "sell", reason: "Underperforming — consider reducing exposure" });
      else if (h.returnPct >= 10) recs.push({ holdingId: h.id, name: h.name, action: "hold", reason: "Solid returns — continue holding" });
      else recs.push({ holdingId: h.id, name: h.name, action: "buy", reason: "Good entry point — consider adding" });
    });
    if (p.analysis.allocationDrift > 8) recs.push({ holdingId: null, name: "Portfolio", action: "rebalance", reason: `Allocation drift of ${p.analysis.allocationDrift}% — rebalance recommended` });
    return clone(recs);
  },

  async getFullPortfolio(clientId) {
    await delay(350);
    const p = dataset.portfolios.find((p) => p.clientId === clientId);
    return p ? clone(p) : null;
  },
};
