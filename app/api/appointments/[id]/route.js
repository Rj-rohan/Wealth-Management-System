import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { id } = await params;
  const apt = await db.findOne("appointments", { id });
  if (!apt) return fail("Appointment not found", 404);
  return ok(apt);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const patch = {};
  if (body.start !== undefined) patch.start = body.start;
  if (body.status !== undefined) patch.status = body.status;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.title !== undefined) patch.title = body.title;
  if (body.type !== undefined) patch.type = body.type;
  if (body.duration !== undefined) patch.duration = body.duration;

  const updated = await db.update("appointments", { id }, patch);
  if (!updated) return fail("Appointment not found", 404);
  return ok(updated);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.remove("appointments", { id });
  return ok({ deleted: true, id });
}
