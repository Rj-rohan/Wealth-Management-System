import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay } from "./mockUtil";

export const riskService = {
  async getProfile(clientId) {
    await delay(250);
    const rp = dataset.riskProfiles.find((r) => r.clientId === clientId);
    return rp ? clone(rp) : null;
  },

  async getScore(clientId) {
    await delay(180);
    const rp = dataset.riskProfiles.find((r) => r.clientId === clientId);
    if (!rp) return null;
    return { score: rp.riskScore, level: rp.riskLevel };
  },

  async getRecommendedAllocation(riskLevel) {
    await delay(150);
    const allocations = {
      conservative: { equity: 20, fixedIncome: 50, cash: 20, alternatives: 5, realEstate: 5 },
      moderately_conservative: { equity: 35, fixedIncome: 40, cash: 15, alternatives: 5, realEstate: 5 },
      balanced: { equity: 50, fixedIncome: 30, cash: 10, alternatives: 5, realEstate: 5 },
      moderately_aggressive: { equity: 65, fixedIncome: 20, cash: 5, alternatives: 5, realEstate: 5 },
      aggressive: { equity: 80, fixedIncome: 10, cash: 3, alternatives: 4, realEstate: 3 },
    };
    return clone(allocations[riskLevel] || allocations.balanced);
  },

  async getSuitableCategories(riskLevel) {
    await delay(150);
    const rp = dataset.riskProfiles.find((r) => r.riskLevel === riskLevel);
    return rp ? clone(rp.suitableCategories) : [];
  },

  async getAlerts() {
    await delay(200);
    const alerts = [];
    dataset.riskProfiles.forEach((rp) => {
      const client = dataset.clients.find((c) => c.id === rp.clientId);
      if (!client) return;
      const riskMap = { conservative: ["conservative", "moderately_conservative"], moderate: ["balanced", "moderately_conservative"], aggressive: ["moderately_aggressive", "aggressive"] };
      const expected = riskMap[client.riskProfile] || [];
      if (!expected.includes(rp.riskLevel)) {
        alerts.push({ clientId: client.id, clientName: client.name, expected: client.riskProfile, actual: rp.riskLevel, score: rp.riskScore });
      }
    });
    return clone(alerts.slice(0, 5));
  },
};
