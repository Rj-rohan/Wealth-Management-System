import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, unauthorized } from "@/lib/api/response";

function load(userId) {
  return (
    db.findOne("advisor_settings", { advisor_id: userId }) ||
    db.insert("advisor_settings", {
      advisor_id: userId,
      notifications: { email: true, push: true, meeting_reminders: true, product_updates: false },
      two_factor: false,
      privacy: { profile_visible: true, show_contact: false },
      theme: "dark",
    })
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok({ settings: load(user.id) });
}

export async function PUT(request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body");
  }

  const allowed = ["notifications", "two_factor", "privacy", "theme"];
  const patch = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  load(user.id);
  const settings = db.update("advisor_settings", { advisor_id: user.id }, patch);

  // Keep the two-factor flag mirrored on the user record.
  if ("two_factor" in patch) {
    db.update("users", { id: user.id }, { two_factor_enabled: patch.two_factor });
  }

  return ok({ settings });
}
