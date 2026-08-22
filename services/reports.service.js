import { apiClient } from "./apiClient";

export const reportsService = {
  async getAvailableReports() {
    return apiClient.get(`/api/reports/types`);
  },

  async getReportData(clientId, reportType) {
    return apiClient.get(`/api/reports/${clientId}/${reportType}`);
  },
};
