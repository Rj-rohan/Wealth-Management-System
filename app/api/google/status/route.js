import { getCurrentUser } from "@/lib/auth/session";
import { googleAuth } from "@/lib/google/googleAuth";
import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET() {
  const user = await getCurrentUser();
  const advisorId = user?.id || "7bdc421d-4a2f-43cb-8961-61a5a1451260";

  const tokenRecord = await db.findOne("google_oauth_tokens", { user_id: advisorId });
  const isConnected = Boolean(tokenRecord && tokenRecord.access_token);

  return ok({
    isConnected,
    isConfigured: googleAuth.isConfigured(),
    googleEmail: tokenRecord?.google_email || null,
    expiryDate: tokenRecord?.expiry_date || null,
    updatedAt: tokenRecord?.updated_at || null,
  });
}
