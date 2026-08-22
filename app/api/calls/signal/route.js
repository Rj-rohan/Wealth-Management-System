import { signalingHub } from "@/lib/webrtc/signalingHub";
import { ok, fail } from "@/lib/api/response";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON");
    }

    const { to, type, callId } = body || {};
    if (!to || !type) {
      return fail("Missing 'to' or 'type' in signal payload");
    }

    // Dispatch to the target peer's active SSE connection
    const delivered = signalingHub.dispatch(to, body);

    return ok({ delivered, type, callId });
  } catch (err) {
    console.error("[Signal Relay Error]:", err);
    return fail(err.message || "Failed to relay signal", 500);
  }
}
