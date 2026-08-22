import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { getAggregateProfile } from "@/lib/repositories/profileRepository";
import { ok, fail, unauthorized } from "@/lib/api/response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok(await getAggregateProfile(user));
}

// Update personal information section.
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
    "full_name",
    "phone",
    "profile_photo",
    "date_of_birth",
    "gender",
    "nationality",
    "bio",
    "address",
    "city",
    "state",
    "country",
  ];
  const patch = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  await db.upsert("advisor_profiles", { user_id: user.id }, patch);
  return ok(await getAggregateProfile(user));
}
