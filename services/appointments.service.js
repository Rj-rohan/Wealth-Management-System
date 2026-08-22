import { apiClient } from "./apiClient";

export const appointmentsService = {
  async list({ scope = "upcoming" } = {}) {
    return apiClient.get(`/api/appointments?scope=${scope}`);
  },

  async getById(id) {
    return apiClient.get(`/api/appointments/${id}`);
  },

  async create(payload) {
    return apiClient.post(`/api/appointments`, payload);
  },

  async reschedule(id, start) {
    return apiClient.patch(`/api/appointments/${id}`, { start, status: "upcoming" });
  },

  async cancel(id) {
    return apiClient.patch(`/api/appointments/${id}`, { status: "cancelled" });
  },

  async saveNotes(id, notes) {
    return apiClient.patch(`/api/appointments/${id}`, { notes });
  },
};
