import { getCurrentUser } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";

export async function GET() {
  const user = await getCurrentUser();
  return ok({ user });
}
