import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay, uid } from "./mockUtil";

export const goalsService = {
  async listByClient(clientId) {
    await delay(250);
    return clone(dataset.goals.filter((g) => g.clientId === clientId));
  },

  async getById(goalId) {
    await delay(180);
    const goal = dataset.goals.find((g) => g.id === goalId);
    return goal ? clone(goal) : null;
  },

  async create(payload) {
    await delay(300);
    const goal = {
      id: uid("goal"),
      progress: 0,
      status: "not_started",
      currentSavings: 0,
      createdAt: new Date().toISOString(),
      ...payload,
    };
    dataset.goals.push(goal);
    return clone(goal);
  },

  async update(goalId, payload) {
    await delay(250);
    const idx = dataset.goals.findIndex((g) => g.id === goalId);
    if (idx === -1) return null;
    dataset.goals[idx] = { ...dataset.goals[idx], ...payload };
    return clone(dataset.goals[idx]);
  },

  async delete(goalId) {
    await delay(200);
    const idx = dataset.goals.findIndex((g) => g.id === goalId);
    if (idx !== -1) dataset.goals.splice(idx, 1);
    return { success: true };
  },

  async getTimeline(clientId) {
    await delay(220);
    const goals = dataset.goals.filter((g) => g.clientId === clientId);
    return clone(
      goals
        .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
        .map((g) => ({
          id: g.id,
          label: g.label,
          type: g.type,
          targetDate: g.targetDate,
          progress: g.progress,
          status: g.status,
        }))
    );
  },

  async getSummary() {
    await delay(200);
    const all = dataset.goals;
    return {
      total: all.length,
      completed: all.filter((g) => g.status === "completed").length,
      onTrack: all.filter((g) => g.status === "on_track").length,
      atRisk: all.filter((g) => g.status === "at_risk").length,
      behind: all.filter((g) => g.status === "behind").length,
    };
  },
};
