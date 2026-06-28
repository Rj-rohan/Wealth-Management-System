import { apiClient } from "@/services/apiClient";

export const settingsService = {
  get: () => apiClient.get("/api/settings"),
  update: (payload) => apiClient.put("/api/settings", payload),
  changePassword: (payload) => apiClient.post("/api/auth/change-password", payload),
  deleteAccount: () => apiClient.del("/api/account"),
};
