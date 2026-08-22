import { getCurrentUser } from "@/lib/auth/session";
import { googleAuth } from "@/lib/google/googleAuth";
import { ok, fail } from "@/lib/api/response";

export async function POST() {
  try {
    const user = await getCurrentUser();
    const advisorId = user?.id || "7bdc421d-4a2f-43cb-8961-61a5a1451260";

    await googleAuth.disconnect(advisorId);
    console.log(`[Google Auth] Disconnected Google Calendar for advisor: ${advisorId}`);

    return ok({ success: true, message: "Google Calendar disconnected successfully" });
  } catch (err) {
    console.error("[Google Disconnect Error]:", err.message);
    return fail(err.message || "Failed to disconnect Google Calendar", 500);
  }
}
