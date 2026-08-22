import { db } from "@/lib/db/database";
import { getCurrentUser, destroySession } from "@/lib/auth/session";
import { ok, unauthorized } from "@/lib/api/response";

// Permanently delete the advisor account and all related records.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const id = user.id;
  await db.remove("advisor_qualifications", { advisor_id: id });
  await db.remove("advisor_certifications", { advisor_id: id });
  await db.remove("advisor_licenses", { advisor_id: id });
  await db.remove("advisor_languages", { advisor_id: id });
  await db.remove("advisor_expertise", { advisor_id: id });
  await db.remove("advisor_availability", { advisor_id: id });
  await db.remove("advisor_professional_details", { advisor_id: id });
  await db.remove("advisor_settings", { advisor_id: id });
  await db.remove("advisor_profiles", { user_id: id });
  await db.remove("sessions", { user_id: id });
  await db.remove("users", { id });

  await destroySession();
  return ok({ deleted: true });
}
