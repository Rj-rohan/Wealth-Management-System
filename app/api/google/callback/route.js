import { googleAuth } from "@/lib/google/googleAuth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // advisorId
  const errorParam = searchParams.get("error");

  const advisorId = state || "7bdc421d-4a2f-43cb-8961-61a5a1451260";

  if (errorParam) {
    console.error("[Google OAuth User Denied]:", errorParam);
    return NextResponse.redirect(new URL("/settings?error=google_access_denied", request.url));
  }

  if (!code) {
    console.error("[Google OAuth Callback Missing Code]");
    return NextResponse.redirect(new URL("/settings?error=google_missing_code", request.url));
  }

  try {
    const tokens = await googleAuth.exchangeCodeForTokens(code);
    await googleAuth.saveTokens(advisorId, tokens);
    console.log(`[Google OAuth Callback] Successfully saved OAuth tokens for advisor: ${advisorId}`);
    return NextResponse.redirect(new URL("/settings?google_connected=true", request.url));
  } catch (err) {
    console.error("[Google OAuth Callback Error]:", err.message);
    return NextResponse.redirect(new URL(`/settings?error=google_oauth_failed&msg=${encodeURIComponent(err.message)}`, request.url));
  }
}
