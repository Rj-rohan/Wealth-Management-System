import { apiClient } from "./apiClient";

export const clientsService = {
  /**
   * List clients with search, filtering, sorting and pagination.
   */
  async list({ search = "", status = "all", risk = "all", sortBy = "name", sortDir = "asc", page = 1, pageSize = 9 } = {}) {
    const params = new URLSearchParams({
      search,
      status,
      risk,
      sortBy,
      sortDir,
      page: String(page),
      pageSize: String(pageSize),
    });
    return apiClient.get(`/api/clients?${params.toString()}`);
  },

  async getById(id) {
    return apiClient.get(`/api/clients/${id}`);
  },

  async stats() {
    return apiClient.get(`/api/clients/stats`);
  },

  async create(payload) {
    return apiClient.post(`/api/clients`, payload);
  },

  async updateStatus(id, status) {
    return apiClient.patch(`/api/clients/${id}/status`, { status });
  },
};
