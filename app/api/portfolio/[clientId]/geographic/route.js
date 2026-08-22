import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const p = await db.findOne("portfolio_data", { client_id: clientId });
  if (!p) return ok([]);

  const holdings = typeof p.holdings === "string" ? JSON.parse(p.holdings) : p.holdings || [];
  const byGeo = {};
  holdings.forEach((h) => {
    const key = h.geography || "Domestic";
    byGeo[key] = (byGeo[key] || 0) + Number(h.currentValue || 0);
  });

  return ok(Object.entries(byGeo).map(([name, value]) => ({ name, value })));
}
