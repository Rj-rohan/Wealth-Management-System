import { apiClient } from "@/services/apiClient";

export const profileService = {
  get: () => apiClient.get("/api/profile"),
  updatePersonal: (payload) => apiClient.put("/api/profile", payload),
  updateProfessional: (payload) => apiClient.put("/api/profile/professional", payload),
  updateAvailability: (payload) => apiClient.put("/api/profile/availability", payload),

  // Multi-entry collections (qualifications, certifications, licenses, etc.)
  addEntry: (collection, payload) => apiClient.post(`/api/profile/${collection}`, payload),
  updateEntry: (collection, payload) => apiClient.put(`/api/profile/${collection}`, payload),
  deleteEntry: (collection, id) => apiClient.del(`/api/profile/${collection}`, { id }),

  uploadPhoto: (file) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.upload("/api/profile/photo", form);
  },
};
