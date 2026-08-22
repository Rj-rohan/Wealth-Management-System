import { apiClient } from "./apiClient";

export const notesService = {
  async list({ search = "", type = "all", clientId = null } = {}) {
    const params = new URLSearchParams({ search, type });
    if (clientId) params.set("clientId", clientId);
    return apiClient.get(`/api/notes?${params.toString()}`);
  },

  async create(payload) {
    return apiClient.post(`/api/notes`, payload);
  },

  async update(id, patch) {
    return apiClient.put(`/api/notes/${id}`, patch);
  },

  async togglePin(id) {
    return apiClient.patch(`/api/notes/${id}/pin`);
  },

  async remove(id) {
    return apiClient.del(`/api/notes/${id}`);
  },
};
