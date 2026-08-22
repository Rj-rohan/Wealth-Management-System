import { db } from "@/lib/db/database";
import { ok, fail, created } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").toLowerCase();
  const category = searchParams.get("category") || "all";
  const clientId = searchParams.get("clientId");

  let rows = await db.findMany("documents");

  if (clientId) rows = rows.filter((d) => (d.client_id || d.clientId) === clientId);
  if (category !== "all") rows = rows.filter((d) => d.category === category);
  if (search) {
    rows = rows.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(search) ||
        (d.client_name || d.clientName || "").toLowerCase().includes(search)
    );
  }

  rows.sort((a, b) => new Date(b.uploaded_at || b.uploadedAt || 0) - new Date(a.uploaded_at || a.uploadedAt || 0));

  const result = rows.map((d) => ({
    id: d.id,
    clientId: d.client_id || d.clientId,
    clientName: d.client_name || d.clientName || "Unassigned",
    name: d.name,
    category: d.category,
    sizeKb: Number(d.size_kb || d.sizeKb || 100),
    uploadedAt: d.uploaded_at || d.uploadedAt,
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

  let clientName = body.clientName || body.client_name || "Unassigned";
  if (body.clientId && !body.clientName) {
    const client = await db.findOne("clients", { id: body.clientId });
    if (client) clientName = client.name;
  }

  const name = body.name ? (body.name.endsWith(".pdf") ? body.name : `${body.name}.pdf`) : "Document.pdf";

  const doc = await db.insert("documents", {
    client_id: body.clientId || null,
    client_name: clientName,
    name,
    category: body.category || "other",
    size_kb: body.sizeKb || Math.floor(Math.random() * 3000) + 120,
    uploaded_at: new Date().toISOString(),
  });

  return created({
    id: doc.id,
    clientId: doc.client_id,
    clientName: doc.client_name,
    name: doc.name,
    category: doc.category,
    sizeKb: doc.size_kb,
    uploadedAt: doc.uploaded_at,
  });
}
