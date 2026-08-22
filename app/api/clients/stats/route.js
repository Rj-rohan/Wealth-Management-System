import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const all = await db.findMany("clients");
  const byStatus = all.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {});
  const totalAUM = all
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + Number(c.assets || 0), 0);

  return ok({
    total: all.length,
    active: byStatus.active || 0,
    prospects: byStatus.prospect || 0,
    totalAUM,
  });
}
