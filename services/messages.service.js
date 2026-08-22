import { apiClient } from "./apiClient";

export const messagesService = {
  async conversations({ search = "" } = {}) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    return apiClient.get(`/api/messages?${params.toString()}`);
  },

  async unreadTotal() {
    return apiClient.get(`/api/messages/unread`);
  },

  async getConversation(id) {
    return apiClient.get(`/api/messages/${id}`);
  },

  async markRead(id) {
    return apiClient.patch(`/api/messages/${id}`);
  },

  async send(id, text) {
    return apiClient.post(`/api/messages/${id}/send`, { text });
  },

  /** Simulate client reply */
  async simulateReply(id) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return apiClient.post(`/api/messages/${id}/reply`);
  },
};
