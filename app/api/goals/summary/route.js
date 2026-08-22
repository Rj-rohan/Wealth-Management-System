import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const all = await db.findMany("client_goals");
  return ok({
    total: all.length,
    completed: all.filter((g) => g.status === "completed").length,
    onTrack: all.filter((g) => g.status === "on_track").length,
    atRisk: all.filter((g) => g.status === "at_risk").length,
    behind: all.filter((g) => g.status === "behind").length,
  });
}
