import { apiClient } from "./apiClient";

export const advisorAdviceService = {
  /**
   * Get latest advisor analysis and generated advice for client
   */
  async getAdvice(clientId) {
    return apiClient.get(`/api/advisor/advice/${clientId}`);
  },

  /**
   * Generate personalized advice using LLM based on advisor analysis, financial data, and goals
   */
  async generateAdvice(payload) {
    return apiClient.post("/api/advisor/generate-advice", payload);
  },
};
