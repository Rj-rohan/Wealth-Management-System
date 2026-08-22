import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function PUT(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const patch = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.body !== undefined) patch.body = body.body;
  if (body.type !== undefined) patch.type = body.type;
  if (body.pinned !== undefined) patch.pinned = body.pinned;

  const updated = await db.update("notes", { id }, patch);
  if (!updated) return fail("Note not found", 404);

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

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.remove("notes", { id });
  return ok({ id });
}
