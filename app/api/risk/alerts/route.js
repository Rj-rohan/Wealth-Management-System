import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const clients = await db.findMany("clients");
  const riskProfiles = await db.findMany("risk_profiles");

  const alerts = [];
  riskProfiles.forEach((rp) => {
    const client = clients.find((c) => c.id === rp.client_id);
    if (!client) return;

    const clientRisk = client.risk_profile || client.riskProfile || "moderate";
    const riskMap = {
      conservative: ["conservative", "moderately_conservative"],
      moderate: ["balanced", "moderately_conservative"],
      aggressive: ["moderately_aggressive", "aggressive"],
    };

    const expected = riskMap[clientRisk] || [];
    const actual = rp.risk_level || rp.riskLevel;
    if (!expected.includes(actual)) {
      alerts.push({
        clientId: client.id,
        clientName: client.name,
        expected: clientRisk,
        actual,
        score: rp.risk_score || rp.riskScore,
      });
    }
  });

  return ok(alerts.slice(0, 5));
}
