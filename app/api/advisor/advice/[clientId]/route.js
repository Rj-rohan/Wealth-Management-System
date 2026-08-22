import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  if (!clientId) return fail("clientId is required");

  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  const advisorAnalysis = await db.findOne("advisor_analyses", { client_id: clientId });
  const adviceRecord = await db.findOne("advisor_advice", { client_id: clientId });

  const adviceList = adviceRecord?.advice
    ? typeof adviceRecord.advice === "string"
      ? JSON.parse(adviceRecord.advice)
      : adviceRecord.advice
    : [];

  return ok({
    clientId,
    client: {
      id: client.id,
      name: client.name,
      riskProfile: client.risk_profile,
      netWorth: client.net_worth,
      assets: client.assets,
      liabilities: client.liabilities,
      income: client.income,
      expenses: client.expenses,
    },
    advisorAnalysis: advisorAnalysis
      ? {
          id: advisorAnalysis.id,
          financialSituationAnalysis: advisorAnalysis.financial_situation_analysis || "",
          goalAnalysis: advisorAnalysis.goal_analysis || "",
          overallAssessment: advisorAnalysis.overall_assessment || "",
          updatedAt: advisorAnalysis.updated_at,
        }
      : null,
    advice: adviceRecord
      ? {
          id: adviceRecord.id,
          summary: adviceRecord.summary || "",
          adviceList,
          updatedAt: adviceRecord.updated_at,
        }
      : null,
  });
}
