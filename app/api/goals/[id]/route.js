import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { id } = await params;
  const goal = await db.findOne("client_goals", { id });
  if (!goal) return fail("Goal not found", 404);
  return ok(formatGoal(goal));
}

export async function PUT(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const patch = {};
  if (body.label !== undefined) patch.label = body.label;
  if (body.type !== undefined) patch.type = body.type;
  if (body.targetAmount !== undefined) patch.target_amount = body.targetAmount;
  if (body.currentSavings !== undefined) patch.current_savings = body.currentSavings;
  if (body.targetDate !== undefined) patch.target_date = body.targetDate;
  if (body.monthlyContribution !== undefined) patch.monthly_contribution = body.monthlyContribution;
  if (body.progress !== undefined) patch.progress = body.progress;
  if (body.priority !== undefined) patch.priority = body.priority;
  if (body.status !== undefined) patch.status = body.status;

  const updated = await db.update("client_goals", { id }, patch);
  if (!updated) return fail("Goal not found", 404);
  return ok(formatGoal(updated));
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.remove("client_goals", { id });
  return ok({ success: true, id });
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
