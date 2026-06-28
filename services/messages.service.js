import { dataset } from "@/lib/mock/dataset";
import { clone, delay, uid } from "./mockUtil";

export const messagesService = {
  async conversations({ search = "" } = {}) {
    await delay(240);
    let rows = clone(dataset.conversations).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => c.clientName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
    }
    return rows.map(({ messages, ...rest }) => rest);
  },

  async unreadTotal() {
    await delay(100);
    return dataset.conversations.reduce((s, c) => s + (c.unread || 0), 0);
  },

  async getConversation(id) {
    await delay(220);
    return clone(dataset.conversations.find((c) => c.id === id) || null);
  },

  async markRead(id) {
    await delay(120);
    const conv = dataset.conversations.find((c) => c.id === id);
    if (conv) {
      conv.messages.forEach((m) => (m.read = true));
      conv.unread = 0;
    }
    return clone(conv);
  },

  async send(id, text) {
    await delay(160);
    const conv = dataset.conversations.find((c) => c.id === id);
    if (!conv) return null;
    const message = { id: uid("msg"), from: "advisor", text, at: new Date().toISOString(), read: true };
    conv.messages.push(message);
    conv.lastMessage = text;
    conv.lastAt = message.at;
    return clone(message);
  },

  /** Simulate an automated client reply for demo purposes. */
  async simulateReply(id) {
    await delay(1400);
    const conv = dataset.conversations.find((c) => c.id === id);
    if (!conv) return null;
    const replies = [
      "Thanks, that makes sense.",
      "Sounds good — let's proceed.",
      "I'll review and get back to you.",
      "Perfect, appreciate the quick response!",
    ];
    const message = {
      id: uid("msg"),
      from: "client",
      text: replies[Math.floor(Math.random() * replies.length)],
      at: new Date().toISOString(),
      read: true,
    };
    conv.messages.push(message);
    conv.lastMessage = message.text;
    conv.lastAt = message.at;
    return clone(message);
  },
};
