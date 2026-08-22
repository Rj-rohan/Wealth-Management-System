import { db } from "@/lib/db/database";
import { ok, fail, created } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const search = (searchParams.get("search") || "").toLowerCase();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  let rows = await db.findMany("financial_plans");

  if (status !== "all") rows = rows.filter((p) => p.status === status);
  if (search) {
    rows = rows.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(search) ||
        (p.client_name || p.clientName || "").toLowerCase().includes(search)
    );
  }

  rows.sort((a, b) => new Date(b.updated_at || b.updatedAt || 0) - new Date(a.updated_at || a.updatedAt || 0));

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize).map(formatPlan);

  return ok({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  let clientName = body.clientName || body.client_name || "Client";
  if (body.clientId && !body.clientName) {
    const client = await db.findOne("clients", { id: body.clientId });
    if (client) clientName = client.name;
  }

  const now = new Date().toISOString();
  const plan = await db.insert("financial_plans", {
    client_id: body.clientId || body.client_id,
    client_name: clientName,
    title: body.title || "Comprehensive Financial Plan",
    status: body.status || "draft",
    version: 1,
    executive_summary: body.executiveSummary || "",
    objectives: body.objectives || [],
    financial_analysis: body.financialAnalysis || "",
    recommended_strategy: body.recommendedStrategy || "",
    asset_allocation: body.assetAllocation || { equity: 50, fixedIncome: 30, cash: 10, alternatives: 5, realEstate: 5 },
    risk_assessment: body.riskAssessment || "",
    action_items: body.actionItems || [],
    advisor_notes: body.advisorNotes || "",
    version_history: [{ version: 1, date: now, changes: "Initial plan creation" }],
  });

  return created(formatPlan(plan));
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
