import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay, uid } from "./mockUtil";

export const financialPlansService = {
  async list({ status = "all", search = "", page = 1, pageSize = 10 } = {}) {
    await delay(300);
    let rows = clone(dataset.financialPlans);
    if (status !== "all") rows = rows.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => p.title.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q));
    }
    rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { items: rows.slice(start, start + pageSize), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async getById(planId) {
    await delay(280);
    const plan = dataset.financialPlans.find((p) => p.id === planId);
    return plan ? clone(plan) : null;
  },

  async create(payload) {
    await delay(350);
    const plan = {
      id: uid("plan"),
      status: "draft",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionHistory: [{ version: 1, date: new Date().toISOString(), changes: "Initial plan creation" }],
      executiveSummary: "",
      objectives: [],
      financialAnalysis: "",
      recommendedStrategy: "",
      assetAllocation: { equity: 50, fixedIncome: 30, cash: 10, alternatives: 5, realEstate: 5 },
      riskAssessment: "",
      actionItems: [],
      advisorNotes: "",
      ...payload,
    };
    dataset.financialPlans.unshift(plan);
    return clone(plan);
  },

  async update(planId, payload) {
    await delay(280);
    const idx = dataset.financialPlans.findIndex((p) => p.id === planId);
    if (idx === -1) return null;
    const plan = dataset.financialPlans[idx];
    const newVersion = plan.version + 1;
    dataset.financialPlans[idx] = {
      ...plan,
      ...payload,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      versionHistory: [...plan.versionHistory, { version: newVersion, date: new Date().toISOString(), changes: "Plan updated" }],
    };
    return clone(dataset.financialPlans[idx]);
  },

  async duplicate(planId) {
    await delay(300);
    const plan = dataset.financialPlans.find((p) => p.id === planId);
    if (!plan) return null;
    const dup = {
      ...clone(plan),
      id: uid("plan"),
      title: `${plan.title} (Copy)`,
      status: "draft",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionHistory: [{ version: 1, date: new Date().toISOString(), changes: "Duplicated from plan " + plan.id }],
    };
    dataset.financialPlans.unshift(dup);
    return dup;
  },

  async archive(planId) {
    await delay(200);
    const plan = dataset.financialPlans.find((p) => p.id === planId);
    if (plan) plan.status = "archived";
    return clone(plan);
  },

  async getByClient(clientId) {
    await delay(250);
    return clone(dataset.financialPlans.filter((p) => p.clientId === clientId));
  },

  async getDueSoon() {
    await delay(200);
    return clone(
      dataset.financialPlans
        .filter((p) => p.status === "active" || p.status === "under_review")
        .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
        .slice(0, 5)
    );
  },
};
