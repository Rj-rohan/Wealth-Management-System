import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, unauthorized } from "@/lib/api/response";
import { randomUUID } from "node:crypto";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON");
    }

    const { id, clientId, callType = "voice", advisorId } = body || {};
    if (!clientId) return fail("Missing clientId");

    const activeAdvisorId = user?.id || advisorId || "7bdc421d-4a2f-43cb-8961-61a5a1451260";
    const callId = id || `call_${randomUUID().slice(0, 10)}`;

    const callRecord = await db.insert("calls", {
      id: callId,
      advisor_id: activeAdvisorId,
      client_id: clientId,
      call_type: callType,
      status: "calling",
      started_at: new Date().toISOString(),
      duration: 0,
    });

    return ok(callRecord);
  } catch (err) {
    console.error("[Create Call Error]:", err);
    return fail(err.message || "Failed to create call", 500);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const query = clientId ? { client_id: clientId } : {};
    let calls = await db.findMany("calls", query);

    calls.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return ok(calls);
  } catch (err) {
    return fail(err.message || "Failed to fetch calls", 500);
  }
}
