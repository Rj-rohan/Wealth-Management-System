import { apiClient } from "./apiClient";

export const analyticsService = {
  async overview() {
    return apiClient.get(`/api/analytics/overview`);
  },
};
