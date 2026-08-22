import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { id } = await params;
  const plan = await db.findOne("financial_plans", { id });
  if (!plan) return fail("Plan not found", 404);
  return ok(formatPlan(plan));
}

export async function PUT(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const existing = await db.findOne("financial_plans", { id });
  if (!existing) return fail("Plan not found", 404);

  const existingHistory = typeof existing.version_history === "string" ? JSON.parse(existing.version_history) : existing.version_history || [];
  const newVersion = (existing.version || 1) + 1;
  const now = new Date().toISOString();

  const patch = {
    version: newVersion,
    version_history: [...existingHistory, { version: newVersion, date: now, changes: body.changes || "Plan updated" }],
  };

  if (body.title !== undefined) patch.title = body.title;
  if (body.status !== undefined) patch.status = body.status;
  if (body.executiveSummary !== undefined) patch.executive_summary = body.executiveSummary;
  if (body.objectives !== undefined) patch.objectives = body.objectives;
  if (body.financialAnalysis !== undefined) patch.financial_analysis = body.financialAnalysis;
  if (body.recommendedStrategy !== undefined) patch.recommended_strategy = body.recommendedStrategy;
  if (body.assetAllocation !== undefined) patch.asset_allocation = body.assetAllocation;
  if (body.riskAssessment !== undefined) patch.risk_assessment = body.riskAssessment;
  if (body.actionItems !== undefined) patch.action_items = body.actionItems;
  if (body.advisorNotes !== undefined) patch.advisor_notes = body.advisorNotes;

  const updated = await db.update("financial_plans", { id }, patch);
  return ok(formatPlan(updated));
}

function formatPlan(p) {
  if (!p) return null;
  return {
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
  };
}
