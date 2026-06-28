// Cookie-based session management backed by the local database.
import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/database";

export const SESSION_COOKIE = "wa_session";
const SESSION_TTL_DAYS = 7;

function expiry() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** Create a session row and set the HTTP-only cookie. */
export async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  db.insert("sessions", { token, user_id: userId, expires: expiry() });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
  return token;
}

/** Resolve the current authenticated user from the session cookie, or null. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = db.findOne("sessions", { token });
  if (!session) return null;

  if (new Date(session.expires) < new Date()) {
    db.remove("sessions", { token });
    return null;
  }

  const user = db.findOne("users", { id: session.user_id });
  if (!user) return null;

  // Never expose secrets to callers.
  const { password_hash, verification_token, reset_token, ...safe } = user;

  // Attach lightweight display fields from the profile for convenience.
  const profile = db.findOne("advisor_profiles", { user_id: user.id });
  return {
    ...safe,
    full_name: profile?.full_name || "",
    profile_photo: profile?.profile_photo || "",
  };
}

/** Destroy the active session and clear the cookie. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db.remove("sessions", { token });
  store.delete(SESSION_COOKIE);
}
