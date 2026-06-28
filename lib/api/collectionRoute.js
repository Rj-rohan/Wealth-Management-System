// Factory that builds CRUD route handlers for an advisor sub-collection
// (qualifications, certifications, licenses, languages, expertise).
import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { getAggregateProfile } from "@/lib/repositories/profileRepository";
import { ok, fail, unauthorized } from "@/lib/api/response";

function pick(body, allowed) {
  const out = {};
  for (const key of allowed) if (key in body) out[key] = body[key];
  return out;
}

export function createCollectionRoutes(table, allowedFields) {
  async function parse(request) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }

  async function POST(request) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await parse(request);
    if (!body) return fail("Invalid request body");

    db.insert(table, { advisor_id: user.id, ...pick(body, allowedFields) });
    return ok(getAggregateProfile(user));
  }

  async function PUT(request) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await parse(request);
    if (!body?.id) return fail("An id is required to update");

    const existing = db.findOne(table, { id: body.id, advisor_id: user.id });
    if (!existing) return fail("Record not found", 404);

    db.update(table, { id: body.id }, pick(body, allowedFields));
    return ok(getAggregateProfile(user));
  }

  async function DELETE(request) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await parse(request);
    if (!body?.id) return fail("An id is required to delete");

    db.remove(table, { id: body.id, advisor_id: user.id });
    return ok(getAggregateProfile(user));
  }

  return { POST, PUT, DELETE };
}
