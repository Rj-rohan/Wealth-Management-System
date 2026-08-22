import { apiClient } from "./apiClient";

export const riskService = {
  async getProfile(clientId) {
    return apiClient.get(`/api/risk/${clientId}`);
  },

  async getScore(clientId) {
    return apiClient.get(`/api/risk/${clientId}/score`);
  },

  async getRecommendedAllocation(riskLevel) {
    return apiClient.get(`/api/risk/allocation/${riskLevel}`);
  },

  async getSuitableCategories(riskLevel) {
    const data = await apiClient.get(`/api/risk/allocation/${riskLevel}`);
    if (riskLevel === "conservative" || riskLevel === "moderately_conservative") {
      return ["Fixed Deposits", "Government Bonds", "Blue Chip Stocks", "Index Funds"];
    }
    if (riskLevel === "balanced") {
      return ["Index Funds", "Balanced Mutual Funds", "Blue Chip Stocks", "Corporate Bonds"];
    }
    return ["Growth Stocks", "Small Cap Funds", "Emerging Market ETFs", "REITs", "Sector ETFs"];
  },

  async getAlerts() {
    return apiClient.get(`/api/risk/alerts`);
  },
};
