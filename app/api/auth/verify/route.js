import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body");
  }

  const { token } = body || {};
  if (!token) return fail("Verification token is required");

  const user = await db.findOne("users", { verification_token: token });
  if (!user) return fail("Invalid or expired verification link", 404);

  await db.update("users", { id: user.id }, { email_verified: true, verification_token: null });
  return ok({ verified: true });
}
