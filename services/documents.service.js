import { dataset } from "@/lib/mock/dataset";
import { clone, delay, uid } from "./mockUtil";

export const documentsService = {
  async list({ search = "", category = "all", clientId = null } = {}) {
    await delay(260);
    let rows = clone(dataset.documents);
    if (clientId) rows = rows.filter((d) => d.clientId === clientId);
    if (category !== "all") rows = rows.filter((d) => d.category === category);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((d) => d.name.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q));
    }
    return rows;
  },

  async recent(limit = 6) {
    await delay(180);
    return clone(dataset.documents.slice(0, limit));
  },

  async categoryCounts() {
    await delay(120);
    return dataset.documents.reduce((acc, d) => ({ ...acc, [d.category]: (acc[d.category] || 0) + 1 }), {});
  },

  async upload({ name, category, clientId }) {
    await delay(400);
    const client = dataset.clients.find((c) => c.id === clientId);
    const doc = {
      id: uid("doc"),
      clientId: clientId || null,
      clientName: client?.name || "Unassigned",
      name: name.endsWith(".pdf") ? name : `${name}.pdf`,
      category: category || "other",
      sizeKb: Math.floor(Math.random() * 3000) + 120,
      uploadedAt: new Date().toISOString(),
    };
    dataset.documents.unshift(doc);
    return clone(doc);
  },

  async remove(id) {
    await delay(200);
    const idx = dataset.documents.findIndex((d) => d.id === id);
    if (idx >= 0) dataset.documents.splice(idx, 1);
    return { id };
  },
};
