import { dataset } from "@/lib/mock/dataset";
import { clone, delay, uid } from "./mockUtil";

export const notesService = {
  async list({ search = "", type = "all", clientId = null } = {}) {
    await delay(220);
    let rows = clone(dataset.notes);
    if (clientId) rows = rows.filter((n) => n.clientId === clientId);
    if (type !== "all") rows = rows.filter((n) => n.type === type);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    }
    // Pinned first, then most recent.
    return rows.sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create(payload) {
    await delay(260);
    const client = payload.clientId ? dataset.clients.find((c) => c.id === payload.clientId) : null;
    const note = {
      id: uid("note"),
      type: "private",
      pinned: false,
      clientId: null,
      clientName: client?.name || "",
      createdAt: new Date().toISOString(),
      ...payload,
    };
    dataset.notes.unshift(note);
    return clone(note);
  },

  async update(id, patch) {
    await delay(200);
    const note = dataset.notes.find((n) => n.id === id);
    if (note) Object.assign(note, patch);
    return clone(note);
  },

  async togglePin(id) {
    await delay(140);
    const note = dataset.notes.find((n) => n.id === id);
    if (note) note.pinned = !note.pinned;
    return clone(note);
  },

  async remove(id) {
    await delay(180);
    const idx = dataset.notes.findIndex((n) => n.id === id);
    if (idx >= 0) dataset.notes.splice(idx, 1);
    return { id };
  },
};
