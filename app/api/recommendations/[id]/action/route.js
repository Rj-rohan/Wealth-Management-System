import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const updated = await db.update("recommendations", { id }, { status: "actioned" });
  if (!updated) return fail("Recommendation not found", 404);

  return ok({
    id: updated.id,
    clientId: updated.client_id || updated.clientId,
    category: updated.category,
    title: updated.title,
    priority: updated.priority,
    explanation: updated.explanation,
    expectedBenefit: updated.expected_benefit || updated.expectedBenefit,
    estimatedTimeline: updated.estimated_timeline || updated.estimatedTimeline,
    status: updated.status,
    createdAt: updated.created_at || updated.createdAt,
  });
}
