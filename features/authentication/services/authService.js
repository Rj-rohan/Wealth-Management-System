import { apiClient } from "@/services/apiClient";

export const authService = {
  register: (payload) => apiClient.post("/api/auth/register", payload),
  login: (payload) => apiClient.post("/api/auth/login", payload),
  logout: () => apiClient.post("/api/auth/logout"),
  getSession: () => apiClient.get("/api/auth/session"),
  verifyEmail: (token) => apiClient.post("/api/auth/verify", { token }),
  forgotPassword: (email) => apiClient.post("/api/auth/forgot-password", { email }),
  resetPassword: (token, password) => apiClient.post("/api/auth/reset-password", { token, password }),
  changePassword: (payload) => apiClient.post("/api/auth/change-password", payload),
};
