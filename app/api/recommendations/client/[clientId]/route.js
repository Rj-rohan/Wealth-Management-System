import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  // Fetch real database records only — NEVER generate hardcoded fake recommendations
  let recs = await db.findMany("recommendations", { client_id: clientId });
  if (category && category !== "all") {
    recs = recs.filter((r) => r.category === category);
  }

  const adviceRecord = await db.findOne("advisor_advice", { client_id: clientId });
  const advisorAnalysis = await db.findOne("advisor_analyses", { client_id: clientId });
  const financialGoals = await db.findMany("client_goals", { client_id: clientId });
  const financialInformation = (await db.findOne("financial_profiles", { client_id: clientId })) || {};

  const adviceList = adviceRecord?.advice
    ? typeof adviceRecord.advice === "string"
      ? JSON.parse(adviceRecord.advice)
      : adviceRecord.advice
    : [];

  const annualIncome = Number(client.income || financialInformation?.income?.total || 0);
  const totalAssets = Number(client.assets || financialInformation?.totalAssets || financialInformation?.assets || 0);
  const netWorth = Number(client.net_worth || client.netWorth || financialInformation?.netWorth || financialInformation?.net_worth || 0);
  const totalLiabilities = Number(client.liabilities || financialInformation?.totalLiabilities || financialInformation?.liabilities || 0);
  const hasFinancialData = Boolean(annualIncome > 0 || totalAssets > 0 || netWorth !== 0 || totalLiabilities > 0 || (financialInformation && Object.keys(financialInformation).length > 0 && (financialInformation.income?.total || financialInformation.assets)));

  const analysisSituation = (advisorAnalysis?.financial_situation_analysis || "").trim();
  const analysisGoal = (advisorAnalysis?.goal_analysis || "").trim();
  const analysisOverall = (advisorAnalysis?.overall_assessment || "").trim();
  const hasAdvisorAnalysis = Boolean(analysisSituation || analysisGoal || analysisOverall);

  const hasGoals = Array.isArray(financialGoals) && financialGoals.length > 0;

  const prerequisites = {
    hasFinancialData,
    hasGoals,
    hasAdvisorAnalysis,
    canGenerate: Boolean(hasFinancialData && hasGoals && hasAdvisorAnalysis),
    hasAdvice: Boolean(adviceRecord && adviceList.length > 0),
  };

  return ok({
    clientId,
    clientName: client.name || `${client.first_name || ""} ${client.last_name || ""}`.trim(),
    prerequisites,
    recommendations: recs.map((r) => ({
      id: r.id,
      clientId: r.client_id || r.clientId,
      category: r.category,
      title: r.title,
      priority: r.priority,
      explanation: r.explanation,
      expectedBenefit: r.expected_benefit || r.expectedBenefit,
      estimatedTimeline: r.estimated_timeline || r.estimatedTimeline,
      status: r.status,
      createdAt: r.created_at || r.createdAt,
    })),
    advisorAdvice: adviceRecord
      ? {
          id: adviceRecord.id,
          summary: adviceRecord.summary || "",
          advice: adviceList,
          updatedAt: adviceRecord.updated_at,
        }
      : null,
    advisorAnalysis: advisorAnalysis
      ? {
          financialSituationAnalysis: advisorAnalysis.financial_situation_analysis,
          goalAnalysis: advisorAnalysis.goal_analysis,
          overallAssessment: advisorAnalysis.overall_assessment,
          updatedAt: advisorAnalysis.updated_at,
        }
      : null,
  });
}
