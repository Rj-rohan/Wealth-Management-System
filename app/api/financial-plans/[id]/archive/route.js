import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const updated = await db.update("financial_plans", { id }, { status: "archived" });
  if (!updated) return fail("Plan not found", 404);
  return ok(updated);
}
