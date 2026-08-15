"use client";
import { useRef, useState } from "react";
import { Camera, BadgeCheck, ShieldAlert } from "lucide-react";
import { Avatar, Badge, ProgressBar, Spinner } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { profileService } from "../services/profileService";

export default function ProfileHeader({ profile, onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const personal = profile?.profile || {};
  const professional = profile?.professional || {};
  const verification = profile?.verification || {};
  const verified = verification.badge === "verified";

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const aggregate = await profileService.uploadPhoto(file);
      onUpdated?.(aggregate);
      success("Profile photo updated");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "radial-gradient(600px circle at 100% 0%, rgba(22,217,106,0.1), transparent 50%), var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <Avatar src={personal.profile_photo} name={personal.full_name} size="xl" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ background: "var(--primary)", color: "#fff", border: "2px solid var(--surface)" }}
            aria-label="Change photo"
          >
            {uploading ? <Spinner size={14} /> : <Camera size={15} />}
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onPick} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              {personal.full_name || "Your name"}
            </h2>
            {verified ? (
              <Badge tone="success" icon={BadgeCheck}>
                Verified
              </Badge>
            ) : (
              <Badge tone="warning" icon={ShieldAlert}>
                Unverified
              </Badge>
            )}
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-strong)" }}>
            {professional.job_title || "Add your professional title"}
            {professional.organization ? ` · ${professional.organization}` : ""}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {personal.email}
          </p>
        </div>

        <div className="w-full sm:w-56">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--muted-strong)" }}>
              Profile completion
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {verification.completion ?? 0}%
            </span>
          </div>
          <ProgressBar value={verification.completion ?? 0} />
        </div>
      </div>
    </div>
  );
}
