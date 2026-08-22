import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const plans = await db.findMany("financial_plans", { client_id: clientId });
  return ok(
    plans.map((p) => ({
      id: p.id,
      clientId: p.client_id || p.clientId,
      clientName: p.client_name || p.clientName,
      title: p.title,
      status: p.status,
      version: p.version || 1,
      executiveSummary: p.executive_summary || p.executiveSummary || "",
      objectives: typeof p.objectives === "string" ? JSON.parse(p.objectives) : p.objectives || [],
      financialAnalysis: p.financial_analysis || p.financialAnalysis || "",
      recommendedStrategy: p.recommended_strategy || p.recommendedStrategy || "",
      assetAllocation: typeof p.asset_allocation === "string" ? JSON.parse(p.asset_allocation) : p.asset_allocation || {},
      riskAssessment: p.risk_assessment || p.riskAssessment || "",
      actionItems: typeof p.action_items === "string" ? JSON.parse(p.action_items) : p.action_items || [],
      advisorNotes: p.advisor_notes || p.advisorNotes || "",
      versionHistory: typeof p.version_history === "string" ? JSON.parse(p.version_history) : p.version_history || [],
      createdAt: p.created_at || p.createdAt,
      updatedAt: p.updated_at || p.updatedAt,
    }))
  );
}
