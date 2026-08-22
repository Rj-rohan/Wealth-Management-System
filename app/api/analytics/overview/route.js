import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET() {
  const clients = await db.findMany("clients");
  const appointments = await db.findMany("appointments");

  const statusBreakdown = ["prospect", "pending", "active", "inactive", "archived"].map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: clients.filter((c) => c.status === s).length,
  }));

  const riskDistribution = ["conservative", "moderate", "aggressive"].map((r) => ({
    name: r.charAt(0).toUpperCase() + r.slice(1),
    value: clients.filter((c) => (c.risk_profile || c.riskProfile) === r).length,
  }));

  const buckets = [
    { name: "20-34", min: 20, max: 34 },
    { name: "35-44", min: 35, max: 44 },
    { name: "45-54", min: 45, max: 54 },
    { name: "55-64", min: 55, max: 64 },
    { name: "65+", min: 65, max: 200 },
  ];
  const ageDistribution = buckets.map((b) => ({
    name: b.name,
    clients: clients.filter((c) => (c.age || 30) >= b.min && (c.age || 30) <= b.max).length,
  }));

  const active = clients.filter((c) => c.status === "active");
  const allocKeys = ["equity", "fixedIncome", "cash", "alternatives", "realEstate"];
  const allocLabels = { equity: "Equity", fixedIncome: "Fixed Income", cash: "Cash", alternatives: "Alternatives", realEstate: "Real Estate" };
  
  const portfolioAllocation = allocKeys.map((k) => {
    const total = active.reduce((s, c) => {
      const alloc = typeof c.allocation === "string" ? JSON.parse(c.allocation) : c.allocation || {};
      return s + (alloc[k] || 0);
    }, 0);
    return {
      name: allocLabels[k],
      value: active.length ? Math.round(total / active.length) : 0,
    };
  });

  const now = new Date();
  const clientGrowth = [];
  let running = Math.max(1, clients.length - 7);
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    running = Math.min(clients.length, running + 1);
    clientGrowth.push({ name: MONTHS[d.getMonth()], clients: running });
  }

  const meetingFrequency = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = appointments.filter((a) => {
      const ad = new Date(a.start);
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
    }).length;
    meetingFrequency.push({ name: MONTHS[d.getMonth()], meetings: count });
  }

  const totalNetWorth = clients.reduce((s, c) => s + Number(c.net_worth || c.netWorth || 0), 0);

  return ok({
    kpis: {
      totalClients: clients.length,
      activeClients: active.length,
      totalAUM: active.reduce((s, c) => s + Number(c.assets || 0), 0),
      avgNetWorth: clients.length ? Math.round(totalNetWorth / clients.length) : 0,
    },
    statusBreakdown,
    riskDistribution,
    ageDistribution,
    portfolioAllocation,
    clientGrowth,
    meetingFrequency,
  });
}
