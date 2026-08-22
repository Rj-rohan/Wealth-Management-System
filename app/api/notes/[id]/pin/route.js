import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const note = await db.findOne("notes", { id });
  if (!note) return fail("Note not found", 404);

  const updated = await db.update("notes", { id }, { pinned: !note.pinned });
  return ok({
    id: updated.id,
    clientId: updated.client_id || updated.clientId,
    clientName: updated.client_name || updated.clientName,
    type: updated.type,
    pinned: Boolean(updated.pinned),
    title: updated.title,
    body: updated.body,
    createdAt: updated.created_at || updated.createdAt,
  });
}
