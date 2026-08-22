import { db } from "@/lib/db/database";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, unauthorized } from "@/lib/api/response";
import { isStrongPassword, isRequired } from "@/utils/validation";

export async function POST(request) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body");
  }

  const { currentPassword, newPassword } = body || {};
  if (!isRequired(currentPassword)) return fail("Current password is required");
  if (!isStrongPassword(newPassword)) return fail("New password must be at least 8 characters and reasonably strong");

  const user = await db.findOne("users", { id: current.id });
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return fail("Current password is incorrect", 403);
  }

  await db.update("users", { id: user.id }, { password_hash: hashPassword(newPassword) });
  return ok({ updated: true });
}
