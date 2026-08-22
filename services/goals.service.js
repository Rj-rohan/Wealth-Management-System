import { apiClient } from "./apiClient";

export const goalsService = {
  async listByClient(clientId) {
    return apiClient.get(`/api/goals/client/${clientId}`);
  },

  async getById(goalId) {
    return apiClient.get(`/api/goals/${goalId}`);
  },

  async create(payload) {
    return apiClient.post(`/api/goals`, payload);
  },

  async update(goalId, payload) {
    return apiClient.put(`/api/goals/${goalId}`, payload);
  },

  async delete(goalId) {
    return apiClient.del(`/api/goals/${goalId}`);
  },

  async getTimeline(clientId) {
    return apiClient.get(`/api/goals/client/${clientId}/timeline`);
  },

  async getSummary() {
    return apiClient.get(`/api/goals/summary`);
  },
};
