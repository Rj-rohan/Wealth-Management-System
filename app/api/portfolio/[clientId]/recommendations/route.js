import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const p = await db.findOne("portfolio_data", { client_id: clientId });
  if (!p) return ok([]);

  const holdings = typeof p.holdings === "string" ? JSON.parse(p.holdings) : p.holdings || [];
  const analysis = typeof p.analysis === "string" ? JSON.parse(p.analysis) : p.analysis || {};

  const recs = [];
  holdings.forEach((h) => {
    const ret = Number(h.returnPct || 0);
    if (ret > 20) {
      recs.push({ holdingId: h.id, name: h.name, action: "hold", reason: "Strong performer — maintain position" });
    } else if (ret < -5) {
      recs.push({ holdingId: h.id, name: h.name, action: "sell", reason: "Underperforming — consider reducing exposure" });
    } else if (ret >= 10) {
      recs.push({ holdingId: h.id, name: h.name, action: "hold", reason: "Solid returns — continue holding" });
    } else {
      recs.push({ holdingId: h.id, name: h.name, action: "buy", reason: "Good entry point — consider adding" });
    }
  });

  if ((analysis.allocationDrift || 0) > 8) {
    recs.push({ holdingId: null, name: "Portfolio", action: "rebalance", reason: `Allocation drift of ${analysis.allocationDrift}% — rebalance recommended` });
  }

  return ok(recs);
}
