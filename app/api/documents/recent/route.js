import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "6", 10);

  let rows = await db.findMany("documents");
  rows.sort((a, b) => new Date(b.uploaded_at || b.uploadedAt || 0) - new Date(a.uploaded_at || a.uploadedAt || 0));

  const result = rows.slice(0, limit).map((d) => ({
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
