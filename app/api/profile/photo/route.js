import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { getAggregateProfile } from "@/lib/repositories/profileRepository";
import { ok, fail, unauthorized } from "@/lib/api/response";

// Local stand-in for the "advisor-profile-images" Supabase storage bucket.
const BUCKET_DIR = path.join(process.cwd(), "public", "uploads", "advisor-profile-images");
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail("Expected multipart form data");
  }

  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return fail("No file provided");
  if (!ALLOWED.includes(file.type)) return fail("Only PNG, JPG, or WEBP images are allowed");
  if (file.size > MAX_BYTES) return fail("Image must be smaller than 4MB", 413);

  if (!fs.existsSync(BUCKET_DIR)) fs.mkdirSync(BUCKET_DIR, { recursive: true });

  const ext = (file.name?.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${user.id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(BUCKET_DIR, filename), buffer);

  const publicPath = `/uploads/advisor-profile-images/${filename}`;
  db.upsert("advisor_profiles", { user_id: user.id }, { profile_photo: publicPath });

  return ok(getAggregateProfile(user));
}
