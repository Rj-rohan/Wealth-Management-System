import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const rp = await db.findOne("risk_profiles", { client_id: clientId });
  if (!rp) {
    const client = await db.findOne("clients", { id: clientId });
    if (!client) return fail("Client not found", 404);
    const riskLevel = client.risk_profile || client.riskProfile || "balanced";
    const score = riskLevel === "conservative" ? 35 : riskLevel === "aggressive" ? 78 : 55;
    return ok({ score, level: riskLevel });
  }
  return ok({ score: rp.risk_score || rp.riskScore || 50, level: rp.risk_level || rp.riskLevel });
}
