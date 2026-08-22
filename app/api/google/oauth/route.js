import { getCurrentUser } from "@/lib/auth/session";
import { googleAuth } from "@/lib/google/googleAuth";
import { ok, fail } from "@/lib/api/response";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const advisorId = user?.id || "7bdc421d-4a2f-43cb-8961-61a5a1451260";

    const isConfigured = googleAuth.isConfigured();
    if (!isConfigured) {
      return fail(
        "Google Calendar OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local",
        400
      );
    }

    const url = googleAuth.getAuthUrl(advisorId);
    const { searchParams } = new URL(request.url);

    // If client requested direct redirect (e.g. clicked standard <a href="..."> link)
    if (searchParams.get("redirect") === "true") {
      return NextResponse.redirect(url);
    }

    return ok({ url, isConfigured: true });
  } catch (err) {
    console.error("[Google OAuth Init Error]:", err.message);
    return fail(err.message || "Failed to initialize Google OAuth", 500);
  }
}
