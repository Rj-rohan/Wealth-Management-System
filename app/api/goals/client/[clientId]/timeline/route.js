import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const goals = await db.findMany("client_goals", { client_id: clientId });
  const timeline = goals
    .sort((a, b) => new Date(a.target_date || a.targetDate || 0) - new Date(b.target_date || b.targetDate || 0))
    .map((g) => ({
      id: g.id,
      label: g.label,
      type: g.type,
      targetDate: g.target_date || g.targetDate,
      progress: Number(g.progress || 0),
      status: g.status,
    }));
  return ok(timeline);
}
