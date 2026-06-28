import { db } from "@/lib/db/database";
import { generateToken } from "@/lib/auth/tokens";
import { ok } from "@/lib/api/response";
import { isEmail } from "@/utils/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { email } = body || {};
  // Always respond with success to avoid leaking which emails are registered.
  if (!isEmail(email)) return ok({ sent: true });

  const user = db.findOne("users", { email: String(email).trim().toLowerCase() });
  if (!user) return ok({ sent: true });

  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.update("users", { id: user.id }, { reset_token: token, reset_expires: expires });

  // Local mode: surface the reset link directly instead of emailing it.
  return ok({ sent: true, resetUrl: `/reset-password?token=${token}` });
}
