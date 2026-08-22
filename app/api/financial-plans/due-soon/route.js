import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const plans = await db.findMany("financial_plans");
  const dueSoon = plans
    .filter((p) => p.status === "active" || p.status === "under_review")
    .sort((a, b) => new Date(a.updated_at || a.updatedAt || 0) - new Date(b.updated_at || b.updatedAt || 0))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      clientId: p.client_id || p.clientId,
      clientName: p.client_name || p.clientName,
      title: p.title,
      status: p.status,
      version: p.version,
      updatedAt: p.updated_at || p.updatedAt,
    }));

  return ok(dueSoon);
}
