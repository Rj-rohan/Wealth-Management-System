import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const rows = await db.findMany("documents");
  const counts = rows.reduce((acc, d) => {
    const cat = d.category || "other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return ok(counts);
}
