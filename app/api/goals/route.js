import { db } from "@/lib/db/database";
import { ok, fail, created } from "@/lib/api/response";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const goal = await db.insert("client_goals", {
    client_id: body.clientId || body.client_id,
    type: body.type || "wealth_creation",
    label: body.label || "Financial Goal",
    target_amount: body.targetAmount || body.target_amount || 100000,
    current_savings: body.currentSavings || body.current_savings || 0,
    target_date: body.targetDate || body.target_date || new Date().toISOString(),
    monthly_contribution: body.monthlyContribution || body.monthly_contribution || 0,
    progress: body.progress || 0,
    priority: body.priority || "medium",
    status: body.status || "not_started",
  });

  return created(formatGoal(goal));
}

function formatGoal(g) {
  if (!g) return null;
  return {
    id: g.id,
    clientId: g.client_id || g.clientId,
    type: g.type,
    label: g.label,
    targetAmount: Number(g.target_amount || g.targetAmount || 0),
    currentSavings: Number(g.current_savings || g.currentSavings || 0),
    targetDate: g.target_date || g.targetDate,
    monthlyContribution: Number(g.monthly_contribution || g.monthlyContribution || 0),
    progress: Number(g.progress || 0),
    priority: g.priority,
    status: g.status,
    createdAt: g.created_at || g.createdAt,
  };
}
