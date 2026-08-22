import { db } from "@/lib/db/database";
import { ok, fail, created } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").toLowerCase();
  const type = searchParams.get("type") || "all";
  const clientId = searchParams.get("clientId");

  let rows = await db.findMany("notes");

  if (clientId) rows = rows.filter((n) => (n.client_id || n.clientId) === clientId);
  if (type !== "all") rows = rows.filter((n) => n.type === type);
  if (search) {
    rows = rows.filter(
      (n) =>
        (n.title || "").toLowerCase().includes(search) ||
        (n.body || "").toLowerCase().includes(search)
    );
  }

  rows.sort((a, b) => Number(b.pinned || false) - Number(a.pinned || false) || new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

  const result = rows.map((n) => ({
    id: n.id,
    clientId: n.client_id || n.clientId,
    clientName: n.client_name || n.clientName || "",
    type: n.type,
    pinned: Boolean(n.pinned),
    title: n.title,
    body: n.body,
    createdAt: n.created_at || n.createdAt,
  }));

  return ok(result);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  let clientName = body.clientName || body.client_name || "";
  if (body.clientId && !clientName) {
    const client = await db.findOne("clients", { id: body.clientId });
    if (client) clientName = client.name;
  }

  const note = await db.insert("notes", {
    client_id: body.clientId || null,
    client_name: clientName,
    type: body.type || "private",
    pinned: Boolean(body.pinned),
    title: body.title || "Note",
    body: body.body || "",
    created_at: new Date().toISOString(),
  });

  return created({
    id: note.id,
    clientId: note.client_id,
    clientName: note.client_name,
    type: note.type,
    pinned: note.pinned,
    title: note.title,
    body: note.body,
    createdAt: note.created_at,
  });
}
