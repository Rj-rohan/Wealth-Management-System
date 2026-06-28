import { db } from "@/lib/db/database";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { isEmail, isRequired } from "@/utils/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body");
  }

  const { email, password } = body || {};
  if (!isEmail(email)) return fail("A valid email is required");
  if (!isRequired(password)) return fail("Password is required");

  const user = db.findOne("users", { email: String(email).trim().toLowerCase() });
  if (!user || !verifyPassword(password, user.password_hash)) {
    return fail("Invalid email or password", 401);
  }

  await createSession(user.id);
  const { password_hash, verification_token, reset_token, ...safe } = user;
  return ok({ user: safe });
}
