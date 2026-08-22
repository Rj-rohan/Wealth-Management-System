import { apiClient } from "./apiClient";

export const scenarioPlannerService = {
  async getBaselineScenario(clientId) {
    return apiClient.get(`/api/scenario-planner/${clientId}/baseline`);
  },

  async simulate(clientId, params) {
    return apiClient.post(`/api/scenario-planner/${clientId}/simulate`, params);
  },
};
