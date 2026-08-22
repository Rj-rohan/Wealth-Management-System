import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const p = await db.findOne("portfolio_data", { client_id: clientId });
  if (!p) return ok(null);

  const analysis = typeof p.analysis === "string" ? JSON.parse(p.analysis) : p.analysis || {};
  return ok({
    totalValue: Number(p.total_value || 0),
    totalCost: Number(p.total_cost || 0),
    totalReturn: Number(p.total_return || 0),
    ...analysis,
  });
}
