import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import { ok, fail } from "@/lib/api/response";
import { isStrongPassword } from "@/utils/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body");
  }

  const { token, password } = body || {};
  if (!token) return fail("Reset token is required");
  if (!isStrongPassword(password)) return fail("Password must be at least 8 characters and reasonably strong");

  const user = db.findOne("users", { reset_token: token });
  if (!user) return fail("Invalid or expired reset link", 404);
  if (user.reset_expires && new Date(user.reset_expires) < new Date()) {
    return fail("This reset link has expired", 410);
  }

  db.update(
    "users",
    { id: user.id },
    { password_hash: hashPassword(password), reset_token: null, reset_expires: null }
  );
  return ok({ reset: true });
}
