import { apiClient } from "./apiClient";

export const recommendationsService = {
  async listByClient(clientId) {
    return apiClient.get(`/api/recommendations/client/${clientId}`);
  },

  async getByCategory(clientId, category) {
    return apiClient.get(`/api/recommendations/client/${clientId}?category=${category}`);
  },

  async markActioned(recId) {
    return apiClient.patch(`/api/recommendations/${recId}/action`);
  },

  async getSummary() {
    return apiClient.get(`/api/recommendations/summary`);
  },
};
