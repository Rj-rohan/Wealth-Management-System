import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay, uid } from "./mockUtil";

const STATUS_ORDER = { prospect: 0, pending: 1, active: 2, inactive: 3, archived: 4 };

export const clientsService = {
  /**
   * List clients with search, filtering, sorting and pagination.
   * Replaceable with a single Supabase query later.
   */
  async list({ search = "", status = "all", risk = "all", sortBy = "name", sortDir = "asc", page = 1, pageSize = 9 } = {}) {
    await delay(280);
    let rows = clone(dataset.clients);

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.occupation.toLowerCase().includes(q)
      );
    }
    if (status !== "all") rows = rows.filter((c) => c.status === status);
    if (risk !== "all") rows = rows.filter((c) => c.riskProfile === risk);

    rows.sort((a, b) => {
      let av;
      let bv;
      if (sortBy === "status") {
        av = STATUS_ORDER[a.status];
        bv = STATUS_ORDER[b.status];
      } else if (sortBy === "netWorth") {
        av = a.netWorth;
        bv = b.netWorth;
      } else if (sortBy === "lastContact") {
        av = new Date(a.lastContact).getTime();
        bv = new Date(b.lastContact).getTime();
      } else {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize);
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async getById(id) {
    const client = dataset.clients.find((c) => c.id === id);
    if (!client) return respond(null, 150);
    const appointments = dataset.appointments.filter((a) => a.clientId === id);
    const documents = dataset.documents.filter((d) => d.clientId === id);
    const notes = dataset.notes.filter((n) => n.clientId === id);
    return respond({ ...client, appointments, documents, notes }, 320);
  },

  async stats() {
    await delay(150);
    const all = dataset.clients;
    const byStatus = all.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {});
    const totalAUM = all.filter((c) => c.status === "active").reduce((s, c) => s + c.assets, 0);
    return {
      total: all.length,
      active: byStatus.active || 0,
      prospects: byStatus.prospect || 0,
      totalAUM,
    };
  },

  async create(payload) {
    await delay(300);
    const client = {
      id: uid("cl"),
      status: "prospect",
      riskProfile: "moderate",
      netWorth: 0,
      assets: 0,
      liabilities: 0,
      income: 0,
      expenses: 0,
      allocation: { equity: 0, fixedIncome: 0, cash: 0, alternatives: 0, realEstate: 0 },
      goals: [],
      tags: [],
      joinedDate: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      ...payload,
      name: `${payload.firstName || ""} ${payload.lastName || ""}`.trim(),
    };
    dataset.clients.unshift(client);
    return clone(client);
  },

  async updateStatus(id, status) {
    await delay(200);
    const client = dataset.clients.find((c) => c.id === id);
    if (client) client.status = status;
    return clone(client);
  },
};
