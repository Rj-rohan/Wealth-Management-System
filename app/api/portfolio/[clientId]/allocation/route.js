import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const p = await db.findOne("portfolio_data", { client_id: clientId });
  if (!p) return ok([]);

  const holdings = typeof p.holdings === "string" ? JSON.parse(p.holdings) : p.holdings || [];
  const byType = {};
  holdings.forEach((h) => {
    const key = (h.type || "other").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    byType[key] = (byType[key] || 0) + Number(h.currentValue || 0);
  });

  return ok(Object.entries(byType).map(([name, value]) => ({ name, value })));
}
