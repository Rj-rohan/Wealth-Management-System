import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const p = await db.findOne("portfolio_data", { client_id: clientId });
  if (!p) return ok([]);
  const holdings = typeof p.holdings === "string" ? JSON.parse(p.holdings) : p.holdings || [];
  return ok(holdings);
}
