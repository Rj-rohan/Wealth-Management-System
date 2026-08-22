import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  let rp = await db.findOne("risk_profiles", { client_id: clientId });
  if (!rp) {
    const riskLevel = client.risk_profile || client.riskProfile || "balanced";
    const riskScore = riskLevel === "conservative" ? 35 : riskLevel === "aggressive" ? 78 : 55;

    const allocations = {
      conservative: { equity: 20, fixedIncome: 50, cash: 20, alternatives: 5, realEstate: 5 },
      moderately_conservative: { equity: 35, fixedIncome: 40, cash: 15, alternatives: 5, realEstate: 5 },
      balanced: { equity: 50, fixedIncome: 30, cash: 10, alternatives: 5, realEstate: 5 },
      moderately_aggressive: { equity: 65, fixedIncome: 20, cash: 5, alternatives: 5, realEstate: 5 },
      aggressive: { equity: 80, fixedIncome: 10, cash: 3, alternatives: 4, realEstate: 3 },
    };

    rp = await db.insert("risk_profiles", {
      client_id: clientId,
      risk_level: riskLevel,
      risk_score: riskScore,
      investment_experience: "intermediate",
      risk_capacity: "medium",
      risk_tolerance: "medium",
      financial_stability: "stable",
      investment_horizon: "long",
      recommended_allocation: allocations[riskLevel] || allocations.balanced,
      suitable_categories: ["Index Funds", "Balanced Mutual Funds", "Blue Chip Stocks", "Corporate Bonds"],
      assessed_at: new Date().toISOString(),
    });
  }

  return ok({
    clientId: rp.client_id,
    riskLevel: rp.risk_level || rp.riskLevel,
    riskScore: Number(rp.risk_score || rp.riskScore || 50),
    investmentExperience: rp.investment_experience || rp.investmentExperience,
    riskCapacity: rp.risk_capacity || rp.riskCapacity,
    riskTolerance: rp.risk_tolerance || rp.riskTolerance,
    financialStability: rp.financial_stability || rp.financialStability,
    investmentHorizon: rp.investment_horizon || rp.investmentHorizon,
    recommendedAllocation: typeof rp.recommended_allocation === "string" ? JSON.parse(rp.recommended_allocation) : rp.recommended_allocation || {},
    suitableCategories: typeof rp.suitable_categories === "string" ? JSON.parse(rp.suitable_categories) : rp.suitable_categories || [],
    assessedAt: rp.assessed_at || rp.assessedAt,
  });
}
