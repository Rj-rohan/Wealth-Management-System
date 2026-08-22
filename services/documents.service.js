import { apiClient } from "./apiClient";

export const documentsService = {
  async list({ search = "", category = "all", clientId = null } = {}) {
    const params = new URLSearchParams({ search, category });
    if (clientId) params.set("clientId", clientId);
    return apiClient.get(`/api/documents?${params.toString()}`);
  },

  async recent(limit = 6) {
    return apiClient.get(`/api/documents/recent?limit=${limit}`);
  },

  async categoryCounts() {
    return apiClient.get(`/api/documents/categories`);
  },

  async upload({ name, category, clientId }) {
    return apiClient.post(`/api/documents`, { name, category, clientId });
  },

  async remove(id) {
    return apiClient.del(`/api/documents/${id}`);
  },
};
