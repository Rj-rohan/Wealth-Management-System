import { apiClient } from "./apiClient";

export const portfolioService = {
  async getHoldings(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}/holdings`);
  },

  async getAllocation(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}/allocation`);
  },

  async getSectorAllocation(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}/sector`);
  },

  async getGeographicAllocation(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}/geographic`);
  },

  async getPerformance(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}/performance`);
  },

  async getAnalysis(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}/analysis`);
  },

  async getRecommendations(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}/recommendations`);
  },

  async getFullPortfolio(clientId) {
    return apiClient.get(`/api/portfolio/${clientId}`);
  },
};
