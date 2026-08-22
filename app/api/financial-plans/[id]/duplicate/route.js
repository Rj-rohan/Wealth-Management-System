import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function POST(request, { params }) {
  const { id } = await params;
  const plan = await db.findOne("financial_plans", { id });
  if (!plan) return fail("Plan not found", 404);

  const now = new Date().toISOString();
  const dup = await db.insert("financial_plans", {
    client_id: plan.client_id,
    client_name: plan.client_name,
    title: `${plan.title} (Copy)`,
    status: "draft",
    version: 1,
    executive_summary: plan.executive_summary,
    objectives: plan.objectives,
    financial_analysis: plan.financial_analysis,
    recommended_strategy: plan.recommended_strategy,
    asset_allocation: plan.asset_allocation,
    risk_assessment: plan.risk_assessment,
    action_items: plan.action_items,
    advisor_notes: plan.advisor_notes,
    version_history: [{ version: 1, date: now, changes: `Duplicated from plan ${plan.id}` }],
  });

  return ok(dup);
}
