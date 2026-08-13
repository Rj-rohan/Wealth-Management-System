import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay } from "./mockUtil";

export const recommendationsService = {
  async listByClient(clientId) {
    await delay(250);
    return clone(dataset.recommendations.filter((r) => r.clientId === clientId));
  },

  async getByCategory(clientId, category) {
    await delay(200);
    return clone(dataset.recommendations.filter((r) => r.clientId === clientId && r.category === category));
  },

  async markActioned(recId) {
    await delay(180);
    const rec = dataset.recommendations.find((r) => r.id === recId);
    if (rec) rec.status = "actioned";
    return rec ? clone(rec) : null;
  },

  async getSummary() {
    await delay(200);
    const all = dataset.recommendations;
    const byCategory = {};
    all.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });
    return {
      total: all.length,
      pending: all.filter((r) => r.status === "pending").length,
      actioned: all.filter((r) => r.status === "actioned").length,
      byCategory,
    };
  },
};
