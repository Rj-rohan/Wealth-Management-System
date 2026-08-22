import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.remove("documents", { id });
  return ok({ id });
}
