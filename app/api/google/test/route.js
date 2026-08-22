import { getCurrentUser } from "@/lib/auth/session";
import { googleAuth } from "@/lib/google/googleAuth";
import { ok, fail } from "@/lib/api/response";

export async function GET() {
  return handleTest();
}

export async function POST() {
  return handleTest();
}

async function handleTest() {
  try {
    const user = await getCurrentUser();
    const advisorId = user?.id || "7bdc421d-4a2f-43cb-8961-61a5a1451260";

    const result = await googleAuth.testConnection(advisorId);

    if (!result.connected) {
      return fail(result.message, 400, { details: result });
    }

    return ok({
      success: true,
      message: result.message,
      calendarSummary: result.calendarSummary,
      timeZone: result.timeZone,
      googleEmail: result.googleEmail,
    });
  } catch (err) {
    console.error("[Google Connection Test Error]:", err.message);
    return fail(err.message || "Failed to test Google Calendar connection", 500);
  }
}
