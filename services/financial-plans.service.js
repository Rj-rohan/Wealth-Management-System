import { apiClient } from "./apiClient";

export const financialPlansService = {
  async list({ status = "all", search = "", page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams({
      status,
      search,
      page: String(page),
      pageSize: String(pageSize),
    });
    return apiClient.get(`/api/financial-plans?${params.toString()}`);
  },

  async getById(planId) {
    return apiClient.get(`/api/financial-plans/${planId}`);
  },

  async create(payload) {
    return apiClient.post(`/api/financial-plans`, payload);
  },

  async update(planId, payload) {
    return apiClient.put(`/api/financial-plans/${planId}`, payload);
  },

  async duplicate(planId) {
    return apiClient.post(`/api/financial-plans/${planId}/duplicate`);
  },

  async archive(planId) {
    return apiClient.patch(`/api/financial-plans/${planId}/archive`);
  },

  async getByClient(clientId) {
    return apiClient.get(`/api/financial-plans/client/${clientId}`);
  },

  async getDueSoon() {
    return apiClient.get(`/api/financial-plans/due-soon`);
  },
};
