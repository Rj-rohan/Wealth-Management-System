import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const goals = await db.findMany("client_goals", { client_id: clientId });
  return ok(
    goals.map((g) => ({
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
    }))
  );
}
