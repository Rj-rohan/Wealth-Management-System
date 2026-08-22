import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/tokens";
import { ok, fail } from "@/lib/api/response";
import { isEmail, isStrongPassword, isRequired } from "@/utils/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body");
  }

  const { fullName, email, password } = body || {};

  if (!isRequired(fullName)) return fail("Full name is required");
  if (!isEmail(email)) return fail("A valid email is required");
  if (!isStrongPassword(password)) return fail("Password must be at least 8 characters and reasonably strong");

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await db.findOne("users", { email: normalizedEmail });
  if (existing) {
    return fail("An account with this email already exists", 409);
  }

  const verificationToken = generateToken();
  const user = await db.insert("users", {
    email: normalizedEmail,
    password_hash: hashPassword(password),
    email_verified: true, // auto-verify for instant onboarding in dev
    verification_token: verificationToken,
    two_factor_enabled: false,
  });

  // Seed related records so the advisor has an editable profile immediately.
  await db.insert("advisor_profiles", {
    user_id: user.id,
    full_name: fullName.trim(),
    email: normalizedEmail,
  });
  await db.insert("advisor_settings", {
    advisor_id: user.id,
    notifications: { email: true, push: true, meeting_reminders: true, product_updates: false },
    two_factor: false,
    privacy: { profile_visible: true, show_contact: false },
    theme: "dark",
  });

  const verifyUrl = `/verify-email?token=${verificationToken}`;
  return ok({ email: normalizedEmail, verifyUrl });
}
