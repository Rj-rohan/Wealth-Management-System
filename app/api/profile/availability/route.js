import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { getAggregateProfile } from "@/lib/repositories/profileRepository";
import { ok, fail, unauthorized } from "@/lib/api/response";

export async function PUT(request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body");
  }

  const allowed = [
    "working_days",
    "working_hours",
    "timezone",
    "consultation_duration",
    "vacation_mode",
  ];
  const patch = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  await db.upsert("advisor_availability", { advisor_id: user.id }, patch);
  return ok(await getAggregateProfile(user));
}
