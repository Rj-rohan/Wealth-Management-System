import { apiClient } from "./apiClient";

export const financialAnalysisService = {
  async getNetWorth(clientId) {
    const data = await apiClient.get(`/api/financial-analysis/${clientId}`);
    if (!data) return null;
    return {
      totalAssets: data.totalAssets,
      totalLiabilities: data.totalLiabilities,
      netWorth: data.netWorth,
      timeline: data.netWorthTimeline || data.timeline,
    };
  },

  async getCashFlow(clientId) {
    const data = await apiClient.get(`/api/financial-analysis/${clientId}`);
    if (!data) return null;
    return {
      monthlyIncome: data.monthlyIncome,
      monthlyExpenses: data.monthlyExpenses,
      monthlySurplus: data.monthlySurplus,
      savingsRate: data.savingsRate,
      history: data.cashFlowHistory || data.history,
    };
  },

  async getIncomeBreakdown(clientId) {
    const data = await apiClient.get(`/api/financial-analysis/${clientId}`);
    return data?.income || null;
  },

  async getExpenseBreakdown(clientId) {
    const data = await apiClient.get(`/api/financial-analysis/${clientId}`);
    return data?.expenses || null;
  },

  async getDebtAnalysis(clientId) {
    const data = await apiClient.get(`/api/financial-analysis/${clientId}`);
    return data?.debts || null;
  },

  async getEmergencyFund(clientId) {
    const data = await apiClient.get(`/api/financial-analysis/${clientId}`);
    return data?.emergencyFund || null;
  },

  async getFinancialHealthScore(clientId) {
    const data = await apiClient.get(`/api/financial-analysis/${clientId}`);
    if (!data) return null;
    return {
      score: data.healthScore,
      savingsRate: data.savingsRate,
      debtRatio: data.debtRatio,
      emiBurden: data.emiBurden,
      emergencyCoverage: data.emergencyCoverage,
    };
  },

  async getFullAnalysis(clientId) {
    return apiClient.get(`/api/financial-analysis/${clientId}`);
  },
};
