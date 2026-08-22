import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON");
    }

    const { status, duration } = body || {};

    const updateFields = {};
    if (status) updateFields.status = status;
    if (duration !== undefined) updateFields.duration = duration;
    if (status === "ended" || status === "rejected" || status === "failed") {
      updateFields.ended_at = new Date().toISOString();
    }

    const updated = await db.update("calls", { id }, updateFields);
    return ok(updated);
  } catch (err) {
    console.error("[Update Call Error]:", err);
    return fail(err.message || "Failed to update call", 500);
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const call = await db.findOne("calls", { id });
    if (!call) return fail("Call not found", 404);
    return ok(call);
  } catch (err) {
    return fail(err.message || "Failed to get call", 500);
  }
}
