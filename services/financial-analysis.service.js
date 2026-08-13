import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay } from "./mockUtil";

export const financialAnalysisService = {
  async getNetWorth(clientId) {
    await delay(280);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    const client = dataset.clients.find((c) => c.id === clientId);
    if (!fp || !client) return null;
    return clone({
      totalAssets: client.assets,
      totalLiabilities: client.liabilities,
      netWorth: client.netWorth,
      timeline: fp.netWorthTimeline,
    });
  },

  async getCashFlow(clientId) {
    await delay(250);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    if (!fp) return null;
    return clone({
      monthlyIncome: fp.income.total,
      monthlyExpenses: fp.expenses.total,
      monthlySurplus: fp.monthlySurplus,
      savingsRate: fp.savingsRate,
      history: fp.cashFlowHistory,
    });
  },

  async getIncomeBreakdown(clientId) {
    await delay(200);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    if (!fp) return null;
    return clone(fp.income);
  },

  async getExpenseBreakdown(clientId) {
    await delay(200);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    if (!fp) return null;
    return clone(fp.expenses);
  },

  async getDebtAnalysis(clientId) {
    await delay(220);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    if (!fp) return null;
    return clone(fp.debts);
  },

  async getEmergencyFund(clientId) {
    await delay(180);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    if (!fp) return null;
    return clone(fp.emergencyFund);
  },

  async getFinancialHealthScore(clientId) {
    await delay(200);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    if (!fp) return null;
    return clone({
      score: fp.healthScore,
      savingsRate: fp.savingsRate,
      debtRatio: fp.debts.debtRatio,
      emiBurden: fp.debts.emiBurden,
      emergencyCoverage: fp.emergencyFund.coverageMonths,
    });
  },

  async getFullAnalysis(clientId) {
    await delay(350);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    const client = dataset.clients.find((c) => c.id === clientId);
    if (!fp || !client) return null;
    return clone({ ...fp, totalAssets: client.assets, totalLiabilities: client.liabilities, netWorth: client.netWorth });
  },
};
