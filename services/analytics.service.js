import { dataset } from "@/lib/mock/dataset";
import { delay } from "./mockUtil";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const analyticsService = {
  async overview() {
    await delay(360);
    const clients = dataset.clients;

    // Client status breakdown
    const statusBreakdown = ["prospect", "pending", "active", "inactive", "archived"].map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: clients.filter((c) => c.status === s).length,
    }));

    // Risk distribution
    const riskDistribution = ["conservative", "moderate", "aggressive"].map((r) => ({
      name: r.charAt(0).toUpperCase() + r.slice(1),
      value: clients.filter((c) => c.riskProfile === r).length,
    }));

    // Age distribution (buckets)
    const buckets = [
      { name: "20-34", min: 20, max: 34 },
      { name: "35-44", min: 35, max: 44 },
      { name: "45-54", min: 45, max: 54 },
      { name: "55-64", min: 55, max: 64 },
      { name: "65+", min: 65, max: 200 },
    ];
    const ageDistribution = buckets.map((b) => ({
      name: b.name,
      clients: clients.filter((c) => c.age >= b.min && c.age <= b.max).length,
    }));

    // Aggregate portfolio allocation (averaged across active clients)
    const active = clients.filter((c) => c.status === "active");
    const allocKeys = ["equity", "fixedIncome", "cash", "alternatives", "realEstate"];
    const allocLabels = { equity: "Equity", fixedIncome: "Fixed Income", cash: "Cash", alternatives: "Alternatives", realEstate: "Real Estate" };
    const portfolioAllocation = allocKeys.map((k) => ({
      name: allocLabels[k],
      value: Math.round(active.reduce((s, c) => s + (c.allocation[k] || 0), 0) / Math.max(1, active.length)),
    }));

    // Client growth (cumulative, last 8 months)
    const now = new Date();
    const clientGrowth = [];
    let running = Math.max(4, clients.length - 14);
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      running += Math.round(1 + Math.random() * 3);
      clientGrowth.push({ name: MONTHS[d.getMonth()], clients: Math.min(running, clients.length + 30) });
    }

    // Meeting frequency by month (last 8 months) from appointments
    const meetingFrequency = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = dataset.appointments.filter((a) => {
        const ad = new Date(a.start);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      }).length;
      meetingFrequency.push({ name: MONTHS[d.getMonth()], meetings: count || Math.floor(Math.random() * 6) + 2 });
    }

    return {
      kpis: {
        totalClients: clients.length,
        activeClients: active.length,
        totalAUM: active.reduce((s, c) => s + c.assets, 0),
        avgNetWorth: Math.round(clients.reduce((s, c) => s + c.netWorth, 0) / clients.length),
      },
      statusBreakdown,
      riskDistribution,
      ageDistribution,
      portfolioAllocation,
      clientGrowth,
      meetingFrequency,
    };
  },
};
