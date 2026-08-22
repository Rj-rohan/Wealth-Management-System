import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const convs = await db.findMany("conversations");
  const unreadTotal = convs.reduce((s, c) => s + (c.unread || 0), 0);
  return ok(unreadTotal);
}
