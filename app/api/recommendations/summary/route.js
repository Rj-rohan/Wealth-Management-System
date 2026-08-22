import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const all = await db.findMany("recommendations");
  const byCategory = {};
  all.forEach((r) => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  });

  return ok({
    total: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    actioned: all.filter((r) => r.status === "actioned").length,
    byCategory,
  });
}
