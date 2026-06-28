"use client";
import { useState } from "react";
import { ShieldCheck, Smartphone, Monitor, KeyRound } from "lucide-react";
import { Card, CardHeader, Toggle, Badge } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { settingsService } from "../services/settingsService";
import ChangePasswordForm from "./ChangePasswordForm";

// Representative active sessions (the live sessions module arrives in a later phase).
const SESSIONS = [
  { id: 1, device: "Chrome · Windows", location: "New York, US", current: true, icon: Monitor },
  { id: 2, device: "Safari · iPhone", location: "New York, US", current: false, icon: Smartphone },
];

export default function SecuritySection({ settings, onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const [saving, setSaving] = useState(false);
  const twoFactor = Boolean(settings?.two_factor);

  async function toggle2FA(value) {
    setSaving(true);
    try {
      const data = await settingsService.update({ two_factor: value });
      onUpdated?.(data.settings);
      success(value ? "Two-factor authentication enabled" : "Two-factor authentication disabled");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Change Password" subtitle="Use a strong, unique password" icon={KeyRound} />
        <ChangePasswordForm />
      </Card>

      <Card>
        <CardHeader title="Two-Factor Authentication" subtitle="Add an extra layer of security" icon={ShieldCheck} />
        <Toggle
          label="Authenticator app"
          description="Require a one-time code from an authenticator app at sign in"
          checked={twoFactor}
          disabled={saving}
          onChange={toggle2FA}
        />
      </Card>

      <Card>
        <CardHeader title="Login Sessions" subtitle="Devices currently signed in" icon={Monitor} />
        <div className="space-y-2">
          {SESSIONS.map(({ id, device, location, current, icon: Icon }) => (
            <div
              key={id}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "var(--surface-hover)", color: "var(--muted-strong)" }}>
                <Icon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {device}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {location}
                </p>
              </div>
              {current && <Badge tone="success">This device</Badge>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
