import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const p = await db.findOne("portfolio_data", { client_id: clientId });
  if (!p) return ok([]);

  const perf = typeof p.performance_history === "string" ? JSON.parse(p.performance_history) : p.performance_history || [];
  return ok(perf);
}
