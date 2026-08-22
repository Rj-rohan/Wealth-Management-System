import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").toLowerCase();

  let rows = await db.findMany("conversations");
  rows.sort((a, b) => new Date(b.last_at || b.lastAt || 0) - new Date(a.last_at || a.lastAt || 0));

  if (search) {
    rows = rows.filter(
      (c) =>
        (c.client_name || c.clientName || "").toLowerCase().includes(search) ||
        (c.last_message || c.lastMessage || "").toLowerCase().includes(search)
    );
  }

  const result = rows.map((c) => ({
    id: c.id,
    clientId: c.client_id || c.clientId,
    clientName: c.client_name || c.clientName,
    lastMessage: c.last_message || c.lastMessage,
    lastAt: c.last_at || c.lastAt,
    unread: c.unread || 0,
  }));

  return ok(result);
}
