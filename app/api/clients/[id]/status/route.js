import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function PATCH(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const { status } = body;
  if (!status) return fail("Status is required");

  const updated = await db.update("clients", { id }, { status });
  if (!updated) return fail("Client not found", 404);

  return ok(updated);
}
